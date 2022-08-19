const logger = require("../../logger.js");
const { Page } = require("./Page.js");
const _ = require("lodash");

class Journal {

  static JOURNAL_SORT = 1000;
  TYPE = "text";
  PAGE_TYPE = "text";

  get section() {
    return this.row.parentId && Number.isInteger(this.row.parentId);
  }

  get note() {
    return false;
  }

  get image() {
    return false;
  }

  appendJournalToChapter() {
    if (this.row.parentId) {
      logger.info(`Appending to chapter... ${this.row.title} ${this.row.parentId} search...`);
      this.adventure.journals.forEach((journal) => {
        if (journal.data.flags.ddb.cobaltId === this.row.parentId) {
          if (this.adventure.config.v10Mode && this.data.pages.length > 0) {
            const page = this.data.pages[0];
            if (page.name != journal.data.name) {
              page.title.show = true;
            }
            journal.data.pages.push(page);
          } else {
            journal.data.content += row.html;
          }
        }
      });
    }
  }

  generatePage(content) {
    const page = new Page({
      name: this.row.title,
      content,
      flags: this.data.flags,
      id: this.data._id,
      type: this.PAGE_TYPE(), level: 1
    });
    return page.toObject();
  }

  generateTable(content) {
    this.adventure.tableFactory.generateTables(this.row, this.data, content);
  }

  // assume that all text journals are unique
  isDuplicate() {
    return false;
  }

  _generateJournalEntryV10(html) {

    if (this.adventure.config.observeAll) this.data.ownership.default = 2;

    const dom = new JSDOM(html);
    const firstElement = dom.window.document.body.firstElementChild;
    const allFirstElements = dom.window.document.body.getElementsByTagName(firstElement.tagName);
    if (firstElement === "H1" || allFirstElements.length === 1) {
      firstElement.remove();
    }
    let content = dom.window.document.body.innerHTML.replace(/\s+/g, " ");
    this.generateTable(content);

    const page = this.generatePage(content);

    if (!this.row.parentId) this.data.flags.ddb.linkId = this.data._id;
    this.data.pages.push(page);

  }

  _generateJournalEntryOld(html) {
    if (this.adventure.config.observeAll) this.data.permission.default = 2;

    const dom = new JSDOM(html);
    const firstElement = dom.window.document.body.firstElementChild;
    try {
      const allFirstElements = dom.window.document.body.getElementsByTagName(firstElement.tagName);
      if (firstElement === "H1" || allFirstElements.length === 1) {
        firstElement.remove();
      }
      this.data.content = dom.window.document.body.innerHTML.replace(/\s+/g, " ");
      this.generateTable(this.data.content);
    } catch (err) {
      logger.error("Journal Generation failed, bad note row?", this.row);
      throw err;
    }

    this.data.flags.ddb.linkId = this.data._id;

  }

  get forceAdd() {
    return false;
  }

  get createHandouts() {
    return ((this.adventure.config.createHandouts && !this.row.player) ||
      (this.row.player && this.config.createPlayerHandouts));
  }

  get createSections() {
    return this.adventure.config.v10Mode
      ? !this.row.parentId // never in v10
      : this.config.createSections; // hidden setting in v9
  }

  addJournal() {
    const validType = this.forceAdd || this.createHandouts || this.createSections;

    // we never add duplicates
    // return !this.duplicate && validType;
    if (!this.duplicate && validType) {
      logger.info(`Appending ${this.row.title} ${this.type} Journal"`);
      this.adventure.journals.push(this);
    }
  }

  getFolder() {
    const folderType = this.section ? "section" : this.TYPE;
    this.data.folder = this.adventure.folderFactory.getFolderId(this.row, "JournalEntry", folderType);
  }

  constructor(adventure, row, flags = {}) {
    this.overrides = overrides;
    this.adventure = adventure;
    // can we reduce memory load by removing 
    // this.row = {
    //   id: row.id,
    //   parentId: row.parentId,
    //   cobaltId: row.cobaltId,
    //   ddbId: row.ddbId,
    //   title: row.title,
    //   contentChunkId: row.contentChunkId,
    //   player: row.player,
    //   name: row.name,
    //   slug: row.slug,
    // };
    this.row = row;
    this.data = this.adventure.config.v10Mode
      ? JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir, "journal-v10.json"))))
      : JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"journal.json"))));

    this.data.name = row.title;
    this.data.flags.ddb.ddbId = row.id;
    this.data.flags.ddb.bookCode = this.adventure.bookCode;
    this.data.flags.ddb.slug = row.slug;
    this.data.flags.ddb.userData = this.adventure.config.run.userData;
    this.data.flags.ddb.originDocId = row.originDocId;
    this.data.flags.ddb.originHint = row.originHint;
    this.data.flags.ddb.originalLink = row.originalLink;
    this.data.flags.ddb.linkName = row.title;

    this.duplicate = this.isDuplicate();
    this.data.flags.ddb.duplicate = this.duplicate;

    const contentChunkId = (row.contentChunkId && row.contentChunkId.trim() != "") ? 
      row.contentChunkId :
      null;
    this.data.flags.ddb.contentChunkId = contentChunkId;

    // entry type
    this.data.flags.ddb.img = this.image;
    this.data.flags.ddb.note = this.note;

    // add override flags
    this.data.flags.ddb = _.merge(this.data.flags.ddb, flags);

    if (row.cobaltId) this.data.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) this.data.flags.ddb.parentId = row.parentId;
    if (!this.row.ddbId) this.row.ddbId = row.id;

    this.data.sort = this.JOURNAL_SORT + parseInt(row.id);
    this.getFolder();
    this.data._id = this.adventure.idFactory.getId(this.data, "JournalEntry");

    if (this.adventure.config.v10Mode) {
      this._generateJournalEntryV10(row.html);
    } else {
      this._generateJournalEntryOld(row.html);
    }

    logger.info(`Generated journal entry ${this.data.name}`);

    this.appendJournalToChapter();
    this.addJournal();
  }

  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }


}


exports.Journal = Journal;
