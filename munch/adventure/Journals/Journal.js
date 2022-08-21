const logger = require("../../logger.js");
const { Page } = require("./Page.js");
const { DiceReplacer, LinkReplacer } = require("../Replacer.js");
const _ = require("lodash");

class Journal {

  static JOURNAL_SORT = 1000;
  TYPE = "text";
  PAGE_TYPE = "text";

  get section() {
    return this.row.data.parentId && Number.isInteger(this.row.data.parentId);
  }

  get note() {
    return false;
  }

  get image() {
    return false;
  }

  appendJournalToChapter() {
    if (this.row.data.parentId) {
      logger.info(`Appending to chapter... ${this.row.data.title} ${this.row.data.parentId} search...`);
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
      name: this.row.data.title,
      content,
      flags: this.data.flags,
      id: this.data._id,
      type: this.PAGE_TYPE(), level: 1
    });
    return page.toObject();
  }

  // assume that all text journals are unique
  isDuplicate() {
    return false;
  }

  setPermissions() {
    if (this.adventure.config.observeAll) {
      if (this.adventure.config.v10Mode) {
        this.data.ownership.default = 2;
      } else {
        this.data.permission.default = 2;
      }
    }
  }

  _generateJournalEntryV10() {
    const firstElement = this.row.doc.body.firstElementChild;
    const allFirstElements = this.row.doc.body.getElementsByTagName(firstElement.tagName);
    if (firstElement === "H1" || allFirstElements.length === 1) {
      firstElement.remove();
    }
    let content = this.row.doc.body.innerHTML.replace(/\s+/g, " ");

    const page = this.generatePage(content);

    if (!this.row.data.parentId) this.data.flags.ddb.linkId = this.data._id;
    this.data.pages.push(page);

  }

  _generateJournalEntryOld() {
    const firstElement = this.row.doc.body.firstElementChild;
    try {
      const allFirstElements = this.row.doc.body.getElementsByTagName(firstElement.tagName);
      if (firstElement === "H1" || allFirstElements.length === 1) {
        firstElement.remove();
      }
      this.data.content = this.row.doc.innerHTML.replace(/\s+/g, " ");
    } catch (err) {
      logger.error("Journal Generation failed, bad note row?", this.row.data);
      throw err;
    }

    this.data.flags.ddb.linkId = this.data._id;

  }

  get forceAdd() {
    return false;
  }

  get createHandouts() {
    return ((this.adventure.config.createHandouts && !this.row.data.player) ||
      (this.row.player && this.config.createPlayerHandouts));
  }

  get createSections() {
    return this.adventure.config.v10Mode
      ? !this.row.data.parentId // never in v10
      : this.config.createSections; // hidden setting in v9
  }

  getFolder() {
    const folderType = this.section ? "section" : this.TYPE;
    this.data.folder = this.adventure.folderFactory.getFolderId(this.row, "JournalEntry", folderType);
  }

  constructor(adventure, row) {
    this.overrides = overrides;
    this.adventure = adventure;
    this.row = row;
    this.data = this.adventure.config.v10Mode
      ? JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir, "journal-v10.json"))))
      : JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"journal.json"))));

    this.data.name = row.data.title;
    this.data.flags.ddb.ddbId = row.data.id;
    this.data.flags.ddb.bookCode = this.adventure.bookCode;
    this.data.flags.ddb.slug = row.data.slug;
    this.data.flags.ddb.userData = this.adventure.config.run.userData;
    this.data.flags.ddb.originDocId = row.data.originDocId;
    this.data.flags.ddb.originHint = row.data.originHint;
    this.data.flags.ddb.originalLink = row.data.originalLink;
    this.data.flags.ddb.linkName = row.data.title;

    this.duplicate = this.isDuplicate();
    this.data.flags.ddb.duplicate = this.duplicate;

    const contentChunkId = (row.data.contentChunkId && row.data.contentChunkId.trim() != "") ? 
      row.data.contentChunkId :
      null;
    this.data.flags.ddb.contentChunkId = contentChunkId;

    // entry type
    this.data.flags.ddb.img = this.image;
    this.data.flags.ddb.note = this.note;

    if (row.data.cobaltId) this.data.flags.ddb.cobaltId = row.data.cobaltId;
    if (row.data.parentId) this.data.flags.ddb.parentId = row.data.parentId;
    if (!this.row.ddbId) this.row.ddbId = row.data.id;

    this.data.sort = this.JOURNAL_SORT + parseInt(row.data.id);
    this.getFolder();
    this.data._id = this.adventure.idFactory.getId(this.data, "JournalEntry");

    this.setPermissions();

    if (this.adventure.config.v10Mode) {
      this._generateJournalEntryV10();
    } else {
      this._generateJournalEntryOld();
    }

    logger.info(`Generated journal entry ${this.data.name}`);

    this.appendJournalToChapter();
  }

  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

  // this runs the replacer for each journal/journal page
  // it should be called after all journals, scenes and tables have been generated
  fixUp() {
    logger.info(`Fixing up text journal: ${this.data.name}`);
    this.adventure.replaceLinks.forEach((link) => {
      if (this.adventure.config.v10Mode) {
        this.data.pages.forEach((page) =>{
          if (page.type === "text") {
            page.text.content = page.text.content.replace(link.html, link.ref);
          }
        });
      } else {
        this.data.content = this.data.content.replace(link.html, link.ref);
      }
    });
 
    if (this.adventure.config.v10Mode) {
      this.data.pages.forEach((page) =>{
        if (page.type === "text") {
          page.text.content = new LinkReplacer(this.adventure, page.text.content, `${this.data.name}`).process().result;
          page.text.content = new DiceReplacer(this.adventure, page.text.content, `${this.data.name}`).process().result;
          page.text.content = page.text.content.replace(/\s+/g, " ");
        }
      });
    } else {
      this.data.content = new LinkReplacer(this.adventure, this.data.content, `${this.data.name}`).process().result;
      this.data.content = new DiceReplacer(this.adventure, this.data.content, `${this.data.name}`).process().result;
      this.data.content = this.data.content.replace(/\s+/g, " ");
    }

  }


}


exports.Journal = Journal;
