const logger = require("../../logger.js");
const { Page } = require("./Page.js");
const { DynamicLinkReplacer } = require("../Replacer.js");
const path = require("path");

class Journal {

  static JOURNAL_SORT = 1000;

  get folderType() {
    return "journal";
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
          const page = this.data.pages[0];
          if (page.name != journal.data.name) {
            page.title.show = true;
          }
          journal.data.pages.push(page);
          journal.contentChunkIds[this.data._id] = this.contentChunkIds[this.data._id];
          journal.elementIds[this.data._id] = this.elementIds[this.data._id];
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
      level: this.row.data.levelHint ?? 1,
    });
    return page.toObject();
  }

  // assume that all text journals are unique
  isDuplicate() {
    return false;
  }

  setPermissions() {
    if (this.adventure.config.data.observeAll) {
      this.data.ownership.default = 2;
    }
  }

  _generateJournalEntryWithPages() {
    const firstElement = this.row.doc.body.firstElementChild;
    const allFirstElements = this.row.doc.body.getElementsByTagName(firstElement.tagName);
    if (firstElement.tagName === "H1" || (allFirstElements.length === 1 && firstElement.tagName !== "P")) {
      firstElement.remove();
    }
    let content = this.row.doc.body.innerHTML.replace(/\s+/g, " ");
    const page = this.generatePage(content);

    if (!this.row.data.parentId) this.data.flags.ddb.linkId = this.data._id;
    this.data.pages.push(page);

  }

  get forceAdd() {
    return Number.isInteger(parseInt(this.row.data.cobaltId));
  }

  get createSections() {
    return !this.row.data.parentId || this.adventure.config.data.noteAdminMode;
  }

  getFolder() {
    const folderType = this.section ? "section" : this.folderType;
    this.data.folder = this.adventure.folderFactory.getFolderId(this.row, "JournalEntry", folderType);
  }

  generateContentLinks() {
    const chunkElements = this.row.doc.body.querySelectorAll("[data-content-chunk-id]");
    const chunkIds = new Set();
    chunkElements.forEach((chunk) => {
      chunkIds.add(chunk.dataset["contentChunkId"]);
    });
    this.contentChunkIds[this.data._id] = chunkIds;

    const idElements = this.row.doc.body.querySelectorAll("[id]");
    const elementIds = new Set();
    idElements.forEach((chunk) => {
      elementIds.add(chunk.id);
    });
    this.elementIds[this.data._id] = elementIds;
  }

  _additionalConstruction() {
    // we don't need this for the core Journal
  }

  constructor(adventure, row, options) {
    logger.info(`Starting journal entry creation ${row.data.title}`);
    this.adventure = adventure;
    this.row = row;
    this.data = JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir, "journal-pages.json"))));

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
    this.data.flags.ddb.slugLink = (row.data.slugLink ?? row.data.title.replace(/[^\w\d]+/g, ""));

    const adjustParent = this.adventure.rowHints.adjustedParents.find((p) => p.id === row.id)
      ?? this.adventure.rowHints.adjustedChildren.find((p) => p.id === row.id);
    if (adjustParent) {
      this.data.flags.ddb.original = adjustParent.original;
    }

    this.duplicate = this.isDuplicate();
    this.data.flags.ddb.duplicate = this.duplicate;

    const contentChunkId = (row.data.contentChunkId && row.data.contentChunkId.trim() != "") 
      ? row.data.contentChunkId
      : null;
    this.data.flags.ddb.contentChunkId = contentChunkId;

    // entry type
    this.data.flags.ddb.img = this.image;
    this.data.flags.ddb.note = this.note;

    if (row.data.cobaltId) this.data.flags.ddb.cobaltId = row.data.cobaltId;
    if (row.data.parentId) this.data.flags.ddb.parentId = row.data.parentId;
    if (!this.row.ddbId) this.row.ddbId = row.data.id;

    this.data.sort = Journal.JOURNAL_SORT + parseInt(row.data.id);

    this.getFolder();
    this.data._id = this.adventure.idFactory.getId(this.data, "JournalEntry");

    this.setPermissions();
    // scan content to get quick matching lookups for notes
    this.contentChunkIds = {};
    this.elementIds = {};
    this.generateContentLinks();
    this._generateJournalEntryWithPages();

    logger.info(`Generated journal entry ${this.data.name}`);
    if (this.adventure.return) this.adventure.returns.statusMessage(`Generated journal entry ${this.data.name}`);

    this.appendJournalToChapter();
  }

  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

  // this runs the replacer for each journal page
  // it should be called after all journals, scenes and tables have been generated
  fixUp() {
    logger.info(`Fixing up text journal: ${this.data.name}`);
    this.adventure.replaceLinks.forEach((link) => {
      this.data.pages.forEach((page) =>{
        if (page.type === "text") {
          page.text.content = page.text.content.replace(link.html, link.ref);
        }
      });
    });

    this.data.pages.forEach((page) =>{
      if (page.type === "text") {
        const linkDetails = { text: page.text.content, name: `${this.data.name}`, journal: this };
        const links = new DynamicLinkReplacer(this.adventure, linkDetails);
        links.process();
        page.text.content = `${links.result}`;
        page.text.content = page.text.content.replace(/\s+/g, " ");
        // Clean up to free memory
        links.dispose();
      }
    });
  }

  // returns page Id if content chunk id known in contents
  getPageIdForContentChunkId(chunkId) {
    for (const [key, value] of Object.entries(this.contentChunkIds)) {
      if (value.has(chunkId)) return key;
    }
    return undefined;
  }

  // returns page Id if element id known in contents
  getPageIdForElementId(elementId) {
    if (!elementId) return undefined;
    let i = 0;
    let j = 0;
    for (const [key, value] of Object.entries(this.elementIds)) {
      i++;
      j += value.size;
      if (value.has(elementId)) return key;
      // if (value.has(elementId.replace(/^0+/, ""))) return key;
    }
    logger.error(`Element id ${elementId} not found in journal ${this.data.name}, trying lowercase fallback`,
      { i,j, length: this.elementIds.length }
    );
    for (const [key, value] of Object.entries(this.elementIds)) {
      const values = new Set(Array.from(value).map((v) => v.toLowerCase()));
      if (values.has(elementId.toLowerCase())) return key;
      // if (value.has(elementId.replace(/^0+/, ""))) return key;
    }
    return undefined;
  }

}


exports.Journal = Journal;
