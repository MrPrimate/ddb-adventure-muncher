"use strict";

// const logger = require("../logger.js");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const logger = require("../logger.js");

const { DiceReplacer, StaticLinkReplacer } = require("./Replacer.js");

class Row {

  constructor(adventure, row) {
    this.adventure = adventure;

    const linkDetails = { text: row.html, name: `${row.slug}` };
    const links = new StaticLinkReplacer(this.adventure, linkDetails);
    links.process();

    const dice = new DiceReplacer(this.adventure, links.result, `${row.slug}`);
    dice.process();

    const frag = new JSDOM(dice.result.replace(/\s+/g, " "));
    if (!row.title || row.title == "") {
      row.title = frag.window.document.body.textContent;
    }

    this.data = Object.freeze(row); 
    logger.silly("ROW DATA", {
      data: this.data
    });
    this.doc = frag.window.document;
    if (global.gc) global.gc();

  }

}

exports.Row = Row;
