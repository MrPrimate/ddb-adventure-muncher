
const logger = require("../../logger.js");
const _ = require("lodash");

class Table {

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
        const low = diceInt(valueMatch[1]);
        const high = diceInt(valueMatch[2]);
        return [low, high];
      }

      if (valueMatch[3]) {
        if (valueMatch[4] !== undefined && valueMatch[4] === "+") {
          const low = diceInt(valueMatch[3]);
          return [low, low + 1];
        }
        if (valueMatch[4] !== undefined && valueMatch[4] === "") {
          const low = diceInt(valueMatch[3]);
          return [low, low];
        }
      }
    }
    logger.error("###############################################");
    logger.info(`Unable to table range match ${value}`);
    logger.info(`Text value: ${text}`);
    logger.error("###############################################");
    return [];
  }


  constructor({adventure, row, parsedTable, keys, diceKeys, diceKey, tableName, contentChunkId, tmpCount}) {
    this.adventure = adventure;
    this.contentChunkId = contentChunkId;
    const tableJsonPath = path.join(this.adventure.overrides.templateDir,"table.json");
    this.data = JSON.parse(JSON.stringify(require(tableJsonPath)));

    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";

    this.data.name = ((tableName && tableName.trim() !== "") ? tableName : "Unnamed Table") + nameExtension;
    this.data.flags.ddb.ddbId = row.id;
    this.data.flags.ddb.bookCode = config.run.bookCode;
    this.data.flags.ddb.slug = row.slug;
    this.data.flags.ddb.contentChunkId = contentChunkId;
    this.data.flags.ddb.userData = config.run.userData;
    this.data.sort = JOURNAL_SORT + parseInt(row.id);
    if (row.cobaltId) this.data.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) this.data.flags.ddb.parentId = row.parentId;

    if (config.observeAll) this.data.permission.default = 2;

    const tableHint = tableHints.find((hint) => hint.contentChunkId == contentChunkId);
    const cobaltId = (this.data.flags.ddb.cobaltId) ? this.data.flags.ddb.cobaltId : this.data.flags.ddb.parentId;
    const folderName = (tableHint && tableHint.folderName) ? tableHint.folderName : null;

    const tableRow = {
      title: this.data.name,
      id: 10000 + this.data.flags.ddb.ddbId + tmpCount,
      cobaltId: cobaltId,
      documentName: this.data.name,
      contentChunkId: contentChunkId,
      nameOverride: folderName,
    };

    this.data.folder = getFolderId(tableRow, "RollTable");
    this.data._id = getId(this.data, "RollTable");

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);
    //logger.info(formulaMatch);
    this.data.formula = formulaMatch ? formulaMatch[0].trim() : "";

    this.data.results = [];
    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry. 
    // if more than one result key then we will concat the results.

    logger.info("*******************************************");
    logger.info(`Generating table ${this.data.name}`);
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
      this.data.results.push(result);
    });

    logger.info(`Generated table entry ${this.data.name}`);
    this.adventure.tables.push(this.data);

  }

  // check to see if I need to override the defaults
  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

}

exports.Table = Table;


