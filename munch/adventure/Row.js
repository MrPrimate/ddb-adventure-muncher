"use strict";

// const logger = require("../logger.js");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const logger = require("../logger.js");

const { DiceReplacer, StaticLinkReplacer } = require("./Replacer.js");

class Row {

  #adventure;

  #frag;

  data;

  doc;

  constructor(adventure, row) {
    this.#adventure = adventure;

    const linkDetails = { text: row.html, name: `${row.slug}` };
    const links = new StaticLinkReplacer(this.#adventure, linkDetails);
    links.process();

    const dice = new DiceReplacer(this.#adventure, links.result, `${row.slug}`);
    dice.process();

    this.#frag = new JSDOM(dice.result.replace(/\s+/g, " "));
    row.title = this.getTitle(row.title);

    const enhancedRowHint = adventure.enhancements.journalHints.find((hint) => 
      hint.childNames.includes(row.title)
    );
    logger.debug("ROW HINT", {
      hintCount: adventure.enhancements.journalHints.length,
      rowHint: enhancedRowHint,
      title: row.title
    });
    if (enhancedRowHint) {
      row.levelHint = enhancedRowHint.levelHint ?? 1;
      const parent = this.#adventure.rowHints.parents.find((row) => row.title == enhancedRowHint.parentName);
      if (parent) {
        row.original = {
          cobaltId: row.cobaltId,
          parentId: row.parentId,
        };
        row.cobaltId = null;
        row.parentId = parent.cobaltId;
        this.#adventure.rowHints.adjustedParents.push({
          id: row.id,
          title: `${row.title}`,
          parentId: row.parentId,
          cobaltId: row.cobaltId,
          original: row.original,
        });
      }
    }
    
    if (!enhancedRowHint
      && row.parentId && row.parentId !== ""
      && !this.#adventure.rowHints.parents.some((r) => r.cobaltId == row.parentId)
    ) {
      // misformated db
      logger.warn("Unable to determine parentID, attempting row adjustment", {
        id: row.id,
        title: row.title,
        parentId: row.parentId,
        cobaltId: row.cobaltId,
        slug: row.slug,
      });

      // row.original = {
      //   cobaltId: row.cobaltId,
      //   parentId: row.parentId,
      // };
      
      row.cobaltId = row.parentId;
      row.parentId = null;

      // this.#adventure.rowHints.adjustedParents.push({
      //   id: row.id,
      //   title: `${row.title}`,
      //   parentId: row.parentId,
      //   cobaltId: row.cobaltId,
      //   original: row.original,
      // });
      if (row.slug && row.slug.endsWith("#")) {
        row.slug = row.slug.substring(0, row.slug.length - 1);
      }

      logger.warn("Adjusted Row data, adding new parent", {
        id: row.id,
        title: row.title,
        parentId: row.parentId,
        cobaltId: row.cobaltId,
        slug: row.slug,
      });
      this.#adventure.rowHints.parents.push({
        id: row.id,
        title: `${row.title}`,
        parentId: row.parentId,
        cobaltId: row.cobaltId,
        slug: `${row.slug}`,
      });
    }

    const parentHint = this.#adventure.rowHints.adjustedParents.find((p) => row.parentId == p.original.cobaltId);
    if (parentHint) {
      row.levelHint = 3;
      row.original = {
        cobaltId: row.cobaltId,
        parentId: row.parentId,
      };
      row.parentId = parentHint.parentId;
      row.cobaltId = null;
      this.#adventure.rowHints.adjustedChildren.push({
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
    this.doc = this.#frag.window.document;
    if (global.gc) global.gc();

  }

  getTitle(title, tag = "H1") {
    if (title && title.trim() !== "") {
      return title;
    }
    const h1s = this.#frag.window.document.body.getElementsByTagName(tag);

    for (const h1 of h1s) {
      if (h1.textContent && h1.textContent.trim() != "") {
        return h1.textContent;
      }
    }

    return this.#frag.window.document.body.textContent;

  }

}

exports.Row = Row;
