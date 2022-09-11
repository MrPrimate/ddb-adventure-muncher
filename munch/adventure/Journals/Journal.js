const logger = require("../../logger.js");
const { Page } = require("./Page.js");
const { DiceReplacer, LinkReplacer } = require("../Replacer.js");
const path = require("path");

class Journal {

  static JOURNAL_SORT = 1000;

  get folderType() {
    return "text";
  }

  get pageType() {
    return "text";
  }

  get section() {
    const hasParentId = this.row.data.parentId && Number.isInteger(this.row.data.parentId);
    return hasParentId && !this.note && !this.image;
  }

  get note() {
    return false;
  }

  get image() {
    return false;
  }

  get id() {
    return this.data._id;
  }

  appendJournalToChapter() {
    if (this.section) {
      logger.info(`Appending to chapter... ${this.row.data.title} ${this.row.data.parentId} search...`);
      this.adventure.journals.forEach((journal) => {
        if (journal.data.flags.ddb.cobaltId === this.row.data.parentId) {
          if (this.adventure.supports.pages && this.data.pages.length > 0) {
            const page = this.data.pages[0];
            if (page.name != journal.data.name) {
              page.title.show = true;
            }
            journal.data.pages.push(page);
          } else {
            journal.data.content += this.data.content;
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
      type: this.pageType,
      level: 1,
    });
    return page.toObject();
  }

  // assume that all text journals are unique
  isDuplicate() {
    return false;
  }

  setPermissions() {
    if (this.adventure.config.data.observeAll) {
      if (this.adventure.config.data.schemaVersion >= 4.0) {
        this.data.ownership.default = 2;
      } else {
        this.data.permission.default = 2;
      }
    }
  }

  _generateJournalEntryWithPages() {
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

  _generateJournalEntryNoPages() {
    const firstElement = this.row.doc.body.firstElementChild;
    try {
      const allFirstElements = this.row.doc.body.getElementsByTagName(firstElement.tagName);
      if (firstElement === "H1" || allFirstElements.length === 1) {
        firstElement.remove();
      }
      this.data.content = this.row.doc.body.innerHTML.replace(/\s+/g, " ");
    } catch (err) {
      logger.error("Journal Generation failed, bad note row?", this.row.data);
      throw err;
    }

    this.data.flags.ddb.linkId = this.data._id;

  }

  get forceAdd() {
    return Number.isInteger(parseInt(this.row.data.cobaltId));
  }

  get createHandouts() {
    return ((this.adventure.config.data.createHandouts && !this.row.data.player) ||
      (this.row.player && this.config.data.createPlayerHandouts));
  }

  get createSections() {
    return this.adventure.supports.pages
      // never with page support
      ? !this.row.data.parentId || this.adventure.config.data.noteAdminMode
      : this.adventure.config.data.createSections; // hidden setting in v9
  }

  getFolder() {
    const folderType = this.section ? "section" : this.folderType;
    this.data.folder = this.adventure.folderFactory.getFolderId(this.row, "JournalEntry", folderType);
  }

  _additionalConstruction() {
    // we don't need this for the core Journal
  }

  constructor(adventure, row, options) {
    this.adventure = adventure;
    this.row = row;
    this.data = this.adventure.supports.pages
      ? JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir, "journal-pages.json"))))
      : JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"journal.json"))));

    this._additionalConstruction(options);

    this.data.name = row.data.title;
    this.data.flags.ddb.ddbId = row.data.id;
    this.data.flags.ddb.bookCode = this.adventure.bookCode;
    this.data.flags.ddb.slug = row.data.slug;
    this.data.flags.ddb.userData = this.adventure.config.userData;
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

    if (this.adventure.supports.pages) {
      this._generateJournalEntryWithPages();
    } else {
      this._generateJournalEntryNoPages();
    }

    logger.info(`Generated journal entry ${this.data.name}`);
    this.adventure.config.returns.statusMessage(`Generated journal entry ${this.data.name}`);

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
      if (this.adventure.supports.pages) {
        this.data.pages.forEach((page) =>{
          if (page.type === "text") {
            page.text.content = page.text.content.replace(link.html, link.ref);
          }
        });
      } else {
        this.data.content = this.data.content.replace(link.html, link.ref);
      }
    });
 
    if (this.adventure.supports.pages) {
      this.data.pages.forEach((page) =>{
        if (page.type === "text") {
          const linkDetails = { text: page.text.content, name: `${this.data.name}`, journal: this };
          const links = new LinkReplacer(this.adventure, linkDetails);
          links.process();
          page.text.content = links.result;
          const dice = new DiceReplacer(this.adventure, page.text.content, `${this.data.name}`);
          dice.process();
          page.text.content = dice.result;
          page.text.content = page.text.content.replace(/\s+/g, " ");
        }
      });
    } else {
      const linkDetails = { text: this.data.content, name: `${this.data.name}`, journal: this };
      const links = new LinkReplacer(this.adventure, linkDetails);
      links.process();
      this.data.content = links.result;
      const dice = new DiceReplacer(this.adventure, this.data.content, `${this.data.name}`);
      dice.process();
      this.data.content = dice.result;
      this.data.content = this.data.content.replace(/\s+/g, " ");
    }

  }


}


exports.Journal = Journal;
