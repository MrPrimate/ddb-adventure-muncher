
const logger = require("../../logger.js");
const path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { IdFactory } = require("../IdFactory.js");
const { DiceReplacer, LinkReplacer } = require("../Replacer.js");
const { Journal } = require("../Journals/Journal.js");


class Table {

  get id() {
    return this.data._id;
  }

  static diceInt(text) {
    if (text === "0") return 10;
    if (text === "00") return 100;
    return parseInt(text);
  }

  /**
   * This could be:
   * a single value e.g. 19
   * a range of values 19-20
   * remaining values 19+
   * @param {*} value 
   * @returns array of range 
   */
  static getDiceTableRange(value) {
    const fragment = JSDOM.fragment(value).textContent;
    const text = fragment.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(/\s/g, "").trim();
    // eslint-disable-next-line no-useless-escape
    const valueRegex = new RegExp(/^(\d+)\-(\d+)|^(\d+)(\+?)$/);
    const valueMatch = text.match(valueRegex);

    if (valueMatch) {
      if (valueMatch[1] !== undefined && valueMatch[2] !== undefined) {
        const low = parseInt(valueMatch[1]);
        const high = Table.diceInt(valueMatch[2]);
        return [low, high];
      }

      if (valueMatch[3]) {
        if (valueMatch[4] !== undefined && valueMatch[4] === "+") {
          const low = Table.diceInt(valueMatch[3]);
          return [low, low + 1];
        }
        if (valueMatch[4] !== undefined && valueMatch[4] === "") {
          const low = Table.diceInt(valueMatch[3]);
          return [low, low];
        }
      }
    }
    logger.error("###############################################");
    logger.error(`Unable to table range match ${value}`);
    logger.error(`Text value: ${text}`);
    logger.error("###############################################");
    return [];
  }


  constructor({adventure, row, diceKey, tableData, count}) {
    this.adventure = adventure;
    this.contentChunkId = tableData.contentChunkId;
    const tableJsonPath = path.join("../../", this.adventure.overrides.templateDir, "table.json");
    this.data = JSON.parse(JSON.stringify(require(tableJsonPath)));

    const nameExtension = tableData.diceKeys > 1 ? ` [${tableData.diceKeys}]` : "";

    this.data.name = ((tableData.tableName && tableData.tableName.trim() !== "")
      ? tableData.tableName
      : "Unnamed Table") + nameExtension;
    this.data.flags.ddb.ddbId = row.id;
    this.data.flags.ddb.bookCode = this.adventure.bookCode;
    this.data.flags.ddb.slug = row.slug;
    this.data.flags.ddb.contentChunkId = tableData.contentChunkId;
    this.data.flags.ddb.userData = this.adventure.config.userData;
    this.data.sort = Journal.JOURNAL_SORT + parseInt(row.id);
    if (row.cobaltId) this.data.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) this.data.flags.ddb.parentId = row.parentId;

    if (this.adventure.config.data.observeAll) {
      if (this.adventure.config.data.v10Mode) {
        this.data.ownership.default = 2;
      } else {
        this.data.permission.default = 2;
      }
    }

    const tableHint = this.adventure.enhancements.tableHints
      .find((hint) => hint.contentChunkId == tableData.contentChunkId);
    const cobaltId = (this.data.flags.ddb.cobaltId)
      ? this.data.flags.ddb.cobaltId
      : this.data.flags.ddb.parentId;
    const folderName = (tableHint && tableHint.folderName) ? tableHint.folderName : null;

    // mock up a row
    const tableRow = {
      data: {
        title: this.data.name,
        id: 10000 + this.data.flags.ddb.ddbId + count,
        cobaltId: cobaltId,
        documentName: this.data.name,
        contentChunkId: tableData.contentChunkId,
        nameOverride: folderName,
      }
    };

    this.data.folder = this.adventure.folderFactory.getFolderId(tableRow, "RollTable");
    this.data._id = this.adventure.idFactory.getId(row, "RollTable");

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);
    //logger.info(formulaMatch);
    this.data.formula = formulaMatch ? formulaMatch[0].trim() : "";

    this.data.results = [];
    const concatKeys = (tableData.keys.length - tableData.diceKeys.length) > 1;
    // loop through rows and build result entry. 
    // if more than one result key then we will concat the results.

    logger.info("*******************************************");
    logger.info(`Generating table ${this.data.name}`);
    if (this.config.debug) logger.debug(row);

    tableData.parsedTable.forEach((entry) => {
      const result = {
        _id: `${IdFactory.random()}`,
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
          result.range = Table.getDiceTableRange(value);
        }
        else if (tableData.diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.text != "") result.text += "\n\n";
          result.text += `<b>${key}</b>${value}`;
        } else {
          result.text = value;
        }
      });
      const replacer = new DiceReplacer(this.adventure, result.text, `${this.data.name}-${result._id}`);
      replacer.process(); 
      result.text = replacer.result;
      const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
      result.text = result.text.replace(diceRollerRegexp, "[[$1]] ($&)");
      this.data.results.push(result);
    });

    logger.info(`Generated table entry ${this.data.name}`);

  }

  // check to see if I need to override the defaults
  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

  fixUp() {
    this.data.results.forEach((result) => {
      const replacer = new LinkReplacer(this.adventure, result.text, `${this.data.name}-${result._id}`);
      replacer.process();
      result.text = replacer.textContent;
    });
  }

}

exports.Table = Table;


