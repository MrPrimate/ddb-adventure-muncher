"use strict";

// const logger = require("../logger.js");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Row {

  constructor(adventure, row) {
    this.adventure = adventure;
    this.data = row; 
    this.doc = new JSDOM(row.html).window.document;
    // this.scenes = [];
    // this.journals = [];
    // this.notes = [];
    // this.tables = [];
    // this.actorIds = [];

  }

}

exports.Row = Row;
