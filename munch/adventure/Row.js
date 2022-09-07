"use strict";

// const logger = require("../logger.js");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const logger = require("../logger.js");

class Row {

  constructor(adventure, row) {
    this.adventure = adventure;

    const frag = new JSDOM(row.html);
    if (!row.title || row.title == "") {
      row.title = frag.window.document.body.textContent;
    }

    this.data = Object.freeze(row); 
    logger.silly("ROW DATA", {
      data: this.data
    });
    this.doc = frag.window.document;

  }

}

exports.Row = Row;
