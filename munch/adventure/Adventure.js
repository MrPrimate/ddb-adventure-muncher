const logger = require("../logger.js");

const { FolderFactory } = require("./FolderFactory.js");
const { IdFactory } = require("./IdFactory.js");
const { TableFactory } = require("./TableFactory.js");
const { JournalFactory } = require("./JournalFactory.js");
const { NoteFactory } = require("./NoteFactory.js");
const { SceneFactory } = require("./SceneFactory.js");
const { Database } = require("./Database.js");
const { FileHelper } = require("./FileHelper.js");
const { Assets } = require("./Assets.js");

// const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const os = require("os");

const jsdom = require("jsdom");
const { Journal } = require("./Journals/Journal.js");
const { JSDOM } = jsdom;

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
    this.sceneFactory = new SceneFactory(this);

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

  rowProcess(row) {
    logger.debug("Processing DB Row: " + row.id + ": " + row.title);

    const existingJournal = this.journals.find((f) => f.flags.ddb.ddbId == row.id);

    if (!existingJournal){
      if (!row.title || row.title == "") {
        const frag = new JSDOM(row.html);
        row.title = frag.window.document.body.textContent;
      }
      logger.info(`Generating ${row.title}`);

      const journal = this.journalFactory.createJournal(row);
      this.notesFactory.generateJournals(row);
      
      // if this is a top tier parent document we process it for scenes now.
      const content = this.adventure.config.v10Mode
        ? journal.data.pages[0]
        : journal.data;
      if (content && journal.data.flags.ddb.cobaltId) {
        this.adventure.sceneFactory.findScenes(row, content);
      }
    }

  }

  async finaliseAdventure(count) {
    logger.info("Data extraction complete document linking commencing...");
    if (err) {
      logger.error(err);
      exit();
    }
    try {
      if (global.gc) global.gc();
      logger.info(`Processing ${documents.length} scenes`);
      documents.forEach((document) => {
        if (document.content) {
          // eslint-disable-next-line no-unused-vars
          let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(document);
          replaceLinks = replaceLinks.concat(tmpReplaceLinks);
          if (global.gc) global.gc();
        } else if (document.pages) {
          document.pages.forEach((page) => {
            // eslint-disable-next-line no-unused-vars
            let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(page);
            replaceLinks = replaceLinks.concat(tmpReplaceLinks);
            if (global.gc) global.gc();
          });
        }
      });
  
      logger.info(`Processing ${count} entries...`);
      logger.info("Looking for missing scenes...");
      [generatedJournals, generatedScenes] = generateMissingScenes(generatedJournals, generatedScenes);
      logger.info("Updating links...");
      generatedJournals = updateJournals(generatedJournals);
      logger.info("Fixing up tables...");
      [generatedTables, generatedJournals] = await fixUpTables(generatedTables, generatedJournals);
      logger.info("Complete! Generating output files...");
      outputAdventure(config);
      outputJournals(generatedJournals, config);
      logger.info("Generated Scenes:");
      logger.info(generatedScenes.map(s => `${s.name} : ${s._id} : ${s.flags.ddb.contentChunkId } : ${s.flags.ddb.ddbId } : ${s.flags.ddb.cobaltId } : ${s.flags.ddb.parentId } : ${s.img}`));
      outputScenes(generatedScenes, config);
      outputTables(generatedTables, config);
      const allContent = generatedJournals.concat(generatedScenes, generatedTables);
      outputFolders(generatedFolders, config, allContent);
  
      // const assets = new Assets(adventure);
      // await assets.downloadEnhancements();
      // await assets.downloadDDBMobile();
      // assets.finalAssetCopy();
      // assets.generateZipFile();
    } catch (err) {
      logger.error(`Error generating adventure: ${err}`);
      logger.error(err.stack);
    } finally {
      logger.info("Generated the following journal images:");
      logger.info(journalImgMatched);
      logger.info("Generated the following scene images:");
      logger.info(sceneImgMatched);
      // save generated Ids table
      configure.saveLookups(idTable);
      if (config.tableFind) {
        configure.saveTableData(tableMatched, config.run.bookCode);
      }
      if (config.imageFind) {
        configure.saveImageFinderResults(imageFinderSceneResults, imageFinderJournalResults, config.run.bookCode);
      }
      if (config.run.returnAdventure) {
        config.run.returnAdventure(config);
      }
    }
  }

  async processAdventure() {
    // ToDo
    // get metadata
    // download adventure
    // get enhanced data
    // asset copy
    await this.downloadAssets();

    const db = new Database(this, this.rowProcess);
    db.getData();
    // rows.forEach()
    // process Journals
    // process Scenes
    // process Tables

    // this.tableFactory.generateNoteRows(this.row);
    
    // run once
    // this.tableFactory.generateJournals();
    // add notes
    // missing scenes
    this.sceneFactory.generateMissingScenes();
    // second loop of asset processing to ensure missed assets are corrected
    this.copyAssets();

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

  async downloadAssets() {
    const assets = new Assets(this);
    await assets.downloadEnhancements();
    await assets.downloadDDBMobile();
  }

  copyAssets() {
    const assets = new Assets(this);
    assets.finalAssetCopy();
  }

  saveZip() {
    this.assets.generateZipFile();
  }


}


exports.Adventure = Adventure;
