const logger = require("../logger.js");

const { FolderFactory } = require("./FolderFactory.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js");
const { JournalFactory } = require("./JournalFactory.js");
const { NoteFactory } = require("./NoteFactory.js");
const { FileHelper } = require("./FileHelper.js");
const { Assets } = require("./Assets.js");

// const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const os = require("os");


class Adventure {

  loadNoteHints() {
    const notesDataFile = path.join(this.config.run.noteInfoDir, `${this.bookCode}.json`);
    const notesDataPath = path.resolve(__dirname, notesDataFile);
  
    if (fs.existsSync(notesDataPath)){
      this.enhancements.noteHints = FileHelper.loadJSONFile(notesDataPath);
    }
  }

  loadTableHints() {
    const tableDataFile = path.join(this.config.run.tableInfoDir, `${this.bookCode}.json`);
    const tableDataPath = path.resolve(__dirname, tableDataFile);

    if (fs.existsSync(tableDataPath)){
      this.enhancements.tableHints = FileHelper.loadJSONFile(tableDataPath);
    }
  }

  loadSceneAdjustments() {
    const jsonFiles = path.join(this.config.run.sceneInfoDir, this.config.run.bookCode, "*.json");

    const globbedPath = os.platform() === "win32"
      ? jsonFiles.replace(/\\/g, "/")
      : jsonFiles;

    logger.info(`jsonFiles from "${jsonFiles}"`);
    logger.info(`globbedPath is "${globbedPath}"`);

    glob.sync(globbedPath).forEach((sceneDataFile) => {
      logger.info(`Loading ${sceneDataFile}`);

      const sceneDataPath = path.resolve(__dirname, sceneDataFile);
      if (fs.existsSync(sceneDataPath)){
        this.enhancements.sceneAdjustments = this.enhancements.sceneAdjustments.concat(FileHelper.loadJSONFile(sceneDataPath));
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
    // assets is a list of all images matches
    this.assets = [];

    // track all scene images found
    this.sceneImages = [];
    // enhancements to dl
    this.downloadList = [];

    this.enhancements = {
      noteHints: [],
      tableHints: [],
      sceneAdjustments: [],
      sceneEnhancements: [],
      hiRes: [],
    };

    this.required = {
      monsters: [],
      items: [],
      spells: [],
      vehicles: [],
      skills: [],
      senses: [],
      conditions: [],
      actions: [],
      weaponproperties: [],
    };

    this.imageFinder = {
      sceneResults: [],
      journalResults: [],
    };
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
      sceneAdjustments: this.enhancements.sceneAdjustments.length,
      sceneEnhancements: this.enhancements.sceneEnhancements.length,
      noteHints: this.enhancements.noteHints.length,
      tableHints: this.enhancements.tableHints.length,
      enhancedScenes: this.enhancements.enhancedScenes.length,
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

  async processAssets() {
    const assets = new Assets(this);
    await assets.downloadEnhancements();
    await assets.downloadDDBMobile();
    assets.finalAssetCopy();
  }

  saveZip() {
    this.assets.generateZipFile();
  }


}


exports.Adventure = Adventure;
