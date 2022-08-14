const logger = require("../logger.js");
const path = require("path");
const { FolderFactory } = require("./FolderFactory.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js")

class Adventure {

  #createMasterFolders() {
    this.masterFolder = {
      JournalEntry: this.folderFactory.generateFolder("JournalEntry", {id: -1, cobaltId: -1, title: this.config.run.book.description}, true),
      Scene: this.folderFactory.generateFolder("Scene", {id: -1, cobaltId: -1, title: this.config.run.book.description}, true),
      RollTable: this.folderFactory.generateFolder("RollTable", {id: -1, cobaltId: -1, title: this.config.run.book.description}, true),
      Actor: this.folderFactory.generateFolder("Actor", {id: -1, cobaltId: -1, title: this.config.run.book.description}, true),
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

  


}


exports.Adventure = Adventure;
