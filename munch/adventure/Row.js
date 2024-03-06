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

    const rowHint = adventure.enhancements.journalHints.find((hint) => 
      hint.childNames.includes(row.title)
    );
    logger.debug("ROW HINT", {
      hintCount: adventure.enhancements.journalHints.length,
      rowHint,
      title: row.title
    });
    if (rowHint) {
      row.levelHint = rowHint.levelHint ?? 1;
      const parent = this.adventure.rowHints.rows.find((row) => row.title == rowHint.parentName);
      if (parent) {
        row.original = {
          cobaltId: row.cobaltId,
          parentId: row.parentId,
        };
        row.cobaltId = null;
        row.parentId = parent.cobaltId;
        this.adventure.rowHints.adjustedParents.push({
          id: row.id,
          title: `${row.title}`,
          parentId: row.parentId,
          cobaltId: row.cobaltId,
          original: row.original,
        });
      }
    }
    const parentHint = this.adventure.rowHints.adjustedParents.find((p) => row.parentId == p.original.cobaltId);
    if (parentHint) {
      row.levelHint = 3;
      row.original = {
        cobaltId: row.cobaltId,
        parentId: row.parentId,
      };
      row.parentId = parentHint.parentId;
      row.cobaltId = null;
      this.adventure.rowHints.adjustedChildren.push({
        id: row.id,
        title: `${row.title}`,
        parentId: row.parentId,
        cobaltId: row.cobaltId,
        original: row.original,
      });
    }

    this.data = Object.freeze(row);

    logger.debug("Row Notes", {
      id: this.data.id,
      title: this.data.title,
      cobaltId: this.data.cobaltId,
      parentId: this.data.parentId,
      original: this.data.original,
      levelHint: this.data.levelHint
    });

    logger.silly("ROW DATA", {
      data: this.data
    });
    this.doc = frag.window.document;
    if (global.gc) global.gc();

  }

}

exports.Row = Row;
