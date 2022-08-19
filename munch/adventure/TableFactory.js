const logger = require("../logger.js");
const { Table } = require("./Tables/Table.js");
const jsdom = require("jsdom");
const { ParsedTable } = require("./Tables/ParsedTable.js");
const { JSDOM } = jsdom;

/**
 * The TableFactory is going to take some html and render out tables from it.
 * Each table in a html doc may end up been multiple tables in Foundry, as in
 * the books they can have multiple rollable columns.
 * When a table is rendered it is added to the adventure tables list
 * 
 * A TableFactory instance should be created for each document to process.
 */

class TableFactory {

  constructor(adventure) {
    this.adventure = adventure;

  }

  // generates a html doc and loops through it to find tables
  generateTables(row, html) {
    this.document = new JSDOM(html).window.document;
    this.tableNodes = document.querySelectorAll("table");

    this.tableNodes.forEach((tableNode) => {
      const parsedTable = new ParsedTable(this.adventure, tableNode);

      let count = 1;
      parsedTable.diceKeys.forEach((diceKey) => {
        const table = new Table({
          adventure: this.adventure,
          diceKey,
          row,
          parsedTable,
          count,
        });

        this.adventure.tables.push(table);
        count++;

      });

    });
  }
}

exports.TableFactory = TableFactory;



function guessTableName(document, contentChunkId) {

  const hintName = tableHints.find((hint) => hint.contentChunkId == contentChunkId);

  if (hintName) {
    return hintName.tableName;
  }

  const element = document.querySelector(`table[data-content-chunk-id='${contentChunkId}']`);
  let track = element;
  let sibling = track.previousElementSibling;
  
  // if (!sibling && track.parentElement.nodeName === "DIV") {
  //   sibling = track.parentElement.previousElementSibling;
  // }

  while (!sibling && track.parentElement && track.parentElement.nodeName === "DIV") {
    if (!track.parentElement.previousElementSibling) {
      track = track.parentElement;
    } else {
      sibling = track.parentElement.previousElementSibling;
    }
  }

  if (sibling) {
    logger.info(sibling.textContent);
    return sibling.textContent;
  } else {
    logger.info(`No table name identified for ${contentChunkId}`);
    return `${document.name}: Unknown Table: ${contentChunkId}`;
  }
}

function buildTable(row, parsedTable, keys, diceKeys, tableName, contentChunkId) {
  let tmpCount = 1;
  diceKeys.forEach((diceKey) => {
    const table = JSON.parse(JSON.stringify(require(path.join(templateDir,"table.json"))));
    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";

    table.name = ((tableName && tableName.trim() !== "") ? tableName : "Unnamed Table") + nameExtension;
    table.flags.ddb.ddbId = row.id;
    table.flags.ddb.bookCode = config.run.bookCode;
    table.flags.ddb.slug = row.slug;
    table.flags.ddb.contentChunkId = contentChunkId;
    table.flags.ddb.userData = config.run.userData;
    table.sort = JOURNAL_SORT + parseInt(row.id);
    if (row.cobaltId) table.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) table.flags.ddb.parentId = row.parentId;

    if (config.observeAll) table.permission.default = 2;

    const tableHint = tableHints.find((hint) => hint.contentChunkId == contentChunkId);
    const cobaltId = (table.flags.ddb.cobaltId) ? table.flags.ddb.cobaltId : table.flags.ddb.parentId;
    const folderName = (tableHint && tableHint.folderName) ? tableHint.folderName : null;

    const tableRow = {
      title: table.name,
      id: 10000 + table.flags.ddb.ddbId + tmpCount,
      cobaltId: cobaltId,
      documentName: table.name,
      contentChunkId: contentChunkId,
      nameOverride: folderName,
    };

    table.folder = getFolderId(tableRow, "RollTable");
    table._id = getId(table, "RollTable");

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);
    //logger.info(formulaMatch);
    table.formula = formulaMatch ? formulaMatch[0].trim() : "";

    table.results = [];
    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry. 
    // if more than one result key then we will concat the results.

    logger.info("*******************************************");
    logger.info(`Generating table ${table.name}`);
    if (config.debug) logger.debug(row);
    // logger.info(parsedTable.length);

    parsedTable.forEach((entry) => {
      const result = {
        _id: `${Ids.random()}`,
        flags: {},
        type: 0,
        text: "",
        img: "icons/svg/d20-black.svg",
        resultId: "",
        weight: 1,
        range: [],
        drawn: false
      };
      Object.entries(entry).forEach(([key, value]) => {
        if (key === diceKey) {
          result.range = getDiceTableRange(value);
        }
        else if (diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.text != "") result.text += "\n\n";
          result.text += `<b>${key}</b>${value}`;
        } else {
          result.text = value;
        }
      });
      result.text = replacer.replaceRollLinks(result.text, config);
      const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
      result.text = result.text.replace(diceRollerRegexp, "[[$1]] ($&)");
      table.results.push(result);
    });

    logger.info(`Generated table entry ${table.name}`);
    generatedTables.push(table);
    tmpCount++;

  });
}

function generateTable(row, journal, html) {
  const document = new JSDOM(html).window.document;
  const tableNodes = document.querySelectorAll("table");

  tableNodes.forEach(node => {
    const parsedTable = parseTable.parseTable(node);
    const keys = parseTable.getHeadings(node);
    const diceKeys = findDiceColumns(node);
    const contentChunkId = node.getAttribute("data-content-chunk-id");
    let nameGuess = guessTableName(document, contentChunkId);

    if (nameGuess.split(" ").length > 5 && diceKeys.length === 1 && keys.length === 2) {
      nameGuess = keys[1];
    }

    logger.info("***********************************************");
    logger.info("Table detection!");
    logger.info(`Table: "${nameGuess}"`);
    logger.info(`ContentChunkId: ${contentChunkId}`);
    logger.info(`Dice Keys: ${diceKeys.join(", ")}`);
    logger.info(`Keys: ${keys.join(", ")}`);
    logger.info("***********************************************");
    if (config.debug) logger.debug(node.outerHTML);
    if (config.debug && parsedTable) logger.debug(parsedTable);
    // if (parsedTable) logger.info(parsedTable);
    logger.info("***********************************************");
    
    buildTable(row, parsedTable, keys, diceKeys, nameGuess, contentChunkId);
    tableMatched.push({
      // foundryId: ,
      nameGuess: nameGuess,
      length: parsedTable.length,
      keys: keys,
      diceKeys: diceKeys,
      diceTable: diceKeys.length > 0,
      multiDiceKeys: diceKeys.length > 1,
      diceKeysNumber: diceKeys.length,
      totalKeys: keys.length,
      journal: journal.name,
      id: node.id,
      class: node.class,
      contentChunkId: contentChunkId,
    });
  });
}
