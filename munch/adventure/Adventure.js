const logger = require("../logger.js");
const utils = require("../utils.js");

const { FolderFactory } = require("./FolderFactory.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js")
const { NoteFactory } = require("./NoteFactory.js");

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const os = require("os");


class Adventure {

  loadNoteHints() {
    const notesDataFile = path.join(this.config.run.noteInfoDir, `${this.bookCode}.json`);
    const notesDataPath = path.resolve(__dirname, notesDataFile);
  
    if (fs.existsSync(notesDataPath)){
      this.enhancements.noteHints = notesData = utils.loadJSONFile(notesDataPath);
    }
  }

  loadTableHints() {
    const tableDataFile = path.join(this.config.run.tableInfoDir, `${this.bookCode}.json`);
    const tableDataPath = path.resolve(__dirname, tableDataFile);

    if (fs.existsSync(tableDataPath)){
      this.enhancements.tableHints = utils.loadJSONFile(tableDataPath);
    }
  }

  loadSceneAdjustments() {
    const jsonFiles = path.join(conf.run.sceneInfoDir, conf.run.bookCode, "*.json");

    const globbedPath = os.platform() === "win32"
      ? jsonFiles.replace(/\\/g, "/")
      : jsonFiles;

    logger.info(`jsonFiles from "${jsonFiles}"`);
    logger.info(`globbedPath is "${globbedPath}"`);

    glob.sync(globbedPath).forEach((sceneDataFile) => {
      logger.info(`Loading ${sceneDataFile}`);

      const sceneDataPath = path.resolve(__dirname, sceneDataFile);
      if (fs.existsSync(sceneDataPath)){
        this.enhancements.sceneAdjustments = this.enhancements.sceneAdjustments.concat(utils.loadJSONFile(sceneDataPath));
      }
    });

    logger.debug(`Scene adjustments : ${this.enhancements.sceneAdjustments.length}`);
    if (this.enhancements.sceneAdjustments.length > 0) {
      logger.debug("Scene Adjustment[0]", this.enhancements.sceneAdjustments[0]);
    } 
  }

  loadHints() {
    this.loadNoteHints();
    this.loadTableHints();
    this.loadSceneAdjustments();
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
    this.tableMatched = [];

    this.replaceLinks = [];
    this.tempHandouts = [];
    this.ids = config.getLookups(this.bookCode);

    this.masterFolder = {};

    // create global factories
    this.idFactory = new IdFactory(this);
    this.folderFactory = new FolderFactory(this);
    this.notesFactory = new NoteFactory(this);

    this.tableFactory = new TableFactory(this);
    this.journalFactory = new JournalFactory(this);


    // initialize master folders
    this.masterFolder = this.folderFactory.masterFolders;

    logger.debug("Current config adjustments", {
      sceneAdjustments: sceneAdjustments.length,
      noteHints: noteHints.length,
      tableHints: tableHints.length,
      enhancedScenes: enhancedScenes.length,
    });

  }

  fixUpAdventure() {
    this.journalFactory.fixUpJournals();

  }

  processAdventure() {
    // ToDo
     // rows.forEach()
      // process Journals
      // process Scenes
      // process Tables

      // this.tableFactory.generateNoteRows(this.row);
    
    // run once
    // this.tableFactory.generateJournals();
    // add notes
    // missing scenes
    // asset copy
    this.processAssets();

    // save
    this.saveZip();
  }



  toJson() {
    // TODO:
    // loop through attached arrays and render out json objects
    // return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

  processAssets() {
    this.assets = new Assets(this);
    await this.assets.downloadEnhancements();
    await this.assets.downloadDDBMobile();
    this.assets.finalAssetCopy();
  }

  saveZip() {
    this.assets.generateZipFile();
  }


}


exports.Adventure = Adventure;
