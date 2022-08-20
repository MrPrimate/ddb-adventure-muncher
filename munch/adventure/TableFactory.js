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

  fixUpTables() {
    this.adventure.tables.forEach((table) => {
      table.fixUp();
      if (global.gc) global.gc();
    })
  }
}

exports.TableFactory = TableFactory;
