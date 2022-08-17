const logger = require("../../logger.js");
const { Page } = require("./Page.js");
const _ = require("lodash");

class Journal {

  static JOURNAL_SORT = 1000;
  TYPE = "text";
  PAGE_TYPE = "text";

  appendJournalToChapter() {
    if (this.row.parentId) {
      logger.info(`Appending to chapter... ${this.row.title} ${this.row.parentId} search...`);
      this.adventure.journals.forEach((journal) => {
        const imageCheck = !this.TYPE === "image";
        if (journal.flags.ddb.cobaltId == this.row.parentId && imageCheck) {
          if (config.v10Mode && this.data.pages.length > 0) {
            const page = this.data.pages[0];
            if (page.name != journal.name) {
              page.title.show = true;
            }
            journal.pages.push(page);
          } else {
            journal.content += row.html;
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
      type: this.PAGE_TYPE, level: 1
    });
    return page.toObject();
  }

  generateTable(content) {
    this.adventure.tableFactory.generateTable(this.row, this.data, content);
  }

  _generateJournalEntryV10() {

    if (this.adventure.config.observeAll) this.data.ownership.default = 2;

    const dom = new JSDOM(this.row.html);
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

  _generateJournalEntryOld() {
    if (this.adventure.config.observeAll) this.data.permission.default = 2;

    const dom = new JSDOM(this.row.html);
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

  addJournal(force = false) {
    const isDuplicate = this.data.flags.ddb.duplicate;
    const createHandouts = ((this.adventure.config.createHandouts && !this.row.player) ||
      (this.row.player && this.config.createPlayerHandouts));
    const createSections = this.adventure.config.v10Mode
      ? !this.row.parentId
      : this.config.createSections;
      // no parent id - top level journal, never in v10, hidden option v9
      // force - create this/override for sub class
      // respect the handout config settings
    const addJournal = force || createHandouts || createSections;

    if (!isDuplicate && addJournal) {
      logger.info(`Appending ${this.row.title} ${this.type} Journal"`);
      this.adventure.journals.push(this.data);
    }
  }

  getFolder() {
    const folderType = this.section ? "section" : this.TYPE;
    this.data.folder = this.adventure.folderFactory.getFolderId(this.row, "JournalEntry", folderType);
  }

  constructor(adventure, row, flags = {}) {
    this.overrides = overrides;
    this.adventure = adventure;
    this.row = row;
    this.data = this.adventure.config.v10Mode
      ? JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir, "journal-v10.json"))))
      : JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"journal.json"))));

    this.data.name = this.row.title;
    this.data.flags.ddb.ddbId = this.row.id;
    this.data.flags.ddb.bookCode = this.adventure.bookCode;
    this.data.flags.ddb.slug = this.row.slug;
    this.data.flags.ddb.userData = this.adventure.config.run.userData;
    this.data.flags.ddb.originDocId = this.row.originDocId;
    this.data.flags.ddb.originHint = this.row.originHint;
    this.data.flags.ddb.originalLink = this.row.originalLink;
    this.section = this.row.parentId;

    const contentChunkId = (this.row.contentChunkId && this.row.contentChunkId.trim() != "") ? 
      this.row.contentChunkId :
      null;
    this.data.flags.ddb.contentChunkId = contentChunkId;

    // entry type
    this.data.flags.ddb.img = false;
    this.data.flags.ddb.note = false;

    // add override flags
    this.data.flags.ddb = _.merge(this.data.flags.ddb, flags);

    if (this.row.cobaltId) this.data.flags.ddb.cobaltId = this.row.cobaltId;
    if (this.row.parentId) this.data.flags.ddb.parentId = this.row.parentId;
    if (!this.row.ddbId) this.row.ddbId = this.row.id;

    this.data.sort = this.JOURNAL_SORT + parseInt(this.row.id);
    this.getFolder();
    this.data._id = this.adventure.idFactory.getId(this.data, "JournalEntry");

    if (this.adventure.config.v10Mode) {
      this._generateJournalEntryV10();
    } else {
      this._generateJournalEntryOld();
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
