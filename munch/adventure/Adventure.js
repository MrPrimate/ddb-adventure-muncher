const logger = require("../logger.js");
const path = require("path");
const { FolderFactory } = require("./FolderFactory.js");
const { Folder } = require("./Folders/Folder.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js")

const _ = require("lodash");

class Adventure {

  #createMasterFolders() {
    const mainRow = { id: -1, cobaltId: -1, title: this.config.run.book.description };

    const folderData = {
      adventure: this,
      row: mainRow,
      specialType: "base",
    };

    this.masterFolder = {
      JournalEntry: new Folder(_.merge(folderData, { type: "JournalEntry"})).toJson(),
      Scene: new Folder(_.merge(folderData, { type: "Scene"})).toJson(),
      RollTable: new Folder(_.merge(folderData, { type: "RollTable"})).toJson(),
      Actor: new Folder(_.merge(folderData, { type: "Actor"})).toJson(),
    };
  }

  constructor(config) {
    this.config = config;
    this.overrides = {
      templateDir: path.join("..", "content", "templates"),
    };
    this.bookCode = config.run.bookCode;
    this.name = config.run.book.description;
    this.folders = [];
    
    this.journals = [];
    this.scenes = [];
    this.tables = [];
    this.cards = [];
    this.actors = [];
    this.assets = [];

    this.enhancements = {
      noteHints: [],
      tableHints: [],
      sceneAdjustments: [],
      hiRes: [],
    };


    this.imageFinder = {
      sceneResults: [],
      journalResults: [],
    }

    this.replaceLinks = [];
    this.tempHandouts = [];
    this.ids = config.getLookups(this.bookCode);

    this.masterFolder = {};

    // create factories
    this.idFactory = new IdFactory(this);
    this.folderFactory = new FolderFactory(this);
    this.journalFactory = new JournalFactory(this);
    this.tableFactory = new TableFactory(this);

    // initialize master folders
    this.#createMasterFolders();

  }

  // check to see if I need to override the defaults
  toJson() {
    // return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }


}


exports.Adventure = Adventure;
