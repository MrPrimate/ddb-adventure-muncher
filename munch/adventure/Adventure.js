const logger = require("../logger.js");
const path = require("path");
const { FolderFactory } = require("./FolderFactory.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js")

const _ = require("lodash");

class Adventure {

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
    this.tableMatched = [];

    this.replaceLinks = [];
    this.tempHandouts = [];
    this.ids = config.getLookups(this.bookCode);

    this.masterFolder = {};

    // create global factories
    this.idFactory = new IdFactory(this);
    this.folderFactory = new FolderFactory(this);
    
    
    
    // These factories are per document and rendered per html doc.
    // this.tableFactory = new TableFactory(this);
    // this.journalFactory = new JournalFactory(this);


    // initialize master folders
    this.masterFolder = this.folderFactory.masterFolders;

  }

  processAdventure() {
    // ToDo
    // process Journals
    // process Scenes
    // process Tables
    // add notes
    // missing scenes
    // asset copy
    // 
  }

  toJson() {
    // TODO:
    // loop through attached arrays and render out json objects
    // return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }


}


exports.Adventure = Adventure;
