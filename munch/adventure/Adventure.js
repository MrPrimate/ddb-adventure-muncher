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
const { Helpers } = require("./Helpers.js");
const { JSDOM } = jsdom;

class Adventure {

  loadNoteHints() {
    const notesDataFile = path.join(this.config.noteInfoDir, `${this.bookCode}.json`);
    const notesDataPath = path.resolve(__dirname, notesDataFile);
  
    if (fs.existsSync(notesDataPath)){
      this.enhancements.noteHints = FileHelper.loadJSONFile(notesDataPath);
    }
  }

  loadTableHints() {
    const tableDataFile = path.join(this.config.tableInfoDir, `${this.bookCode}.json`);
    const tableDataPath = path.resolve(__dirname, tableDataFile);

    if (fs.existsSync(tableDataPath)){
      this.enhancements.tableHints = FileHelper.loadJSONFile(tableDataPath);
    }
  }

  loadSceneAdjustments() {
    const jsonFiles = path.join(this.config.sceneInfoDir, this.config.bookCode, "*.json");

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
    logger.info(`Adventure Muncher version ${config.version}`);
    logger.info(`Starting Adventure instance for ${config.bookCode}`);
    this.config = config;
    this.overrides = {
      templateDir: path.join("..", "content", "templates"),
    };
    this.bookCode = config.bookCode;
    this.name = config.book.description;
    this.folders = [];
    
    this.journals = [];
    this.scenes = [];
    this.tables = [];
    this.cards = [];
    this.actors = [];

    // assets is a list of all images matches in journals for handouts
    this.assets = [];
    // track all tables
    this.tableMatched = [];
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

    this.replaceLinks = [];
    this.tempHandouts = [];
    this.ids = this.getLookups(false);

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

  #fixUpAdventure() {
    logger.info("Looking for missing scenes...");
    this.sceneFactory.generateMissingScenes();
    logger.info("Updating links...");
    this.journalFactory.fixUpJournals();
    logger.info("Fixing up tables...");
    this.tableFactory.fixUpTables();
  }

  processRow(row) {
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
      // if (content && journal.data.flags.ddb.cobaltId) {
      if (content) {
        this.adventure.sceneFactory.findScenes(row, content);
      }
    }

  }

  saveJson() {
    // output all adventure elements to json
    logger.info("Generating output files...");
    this.#outputAdventure();
    this.#outputJournals();
    this.#outputScenes();
    this.#outputTables();
    this.#outputFolders();
  }

  // not sure we actually need to do a second pass for scenes, I think we can
  // now get them on first pass
  async #secondPass() {
    logger.info(`Processing ${this.journals.length} scenes`);
    // documents.forEach((document) => {
    //   if (document.content) {
    //     // eslint-disable-next-line no-unused-vars
    //     let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(document);
    //     replaceLinks = replaceLinks.concat(tmpReplaceLinks);
    //     if (global.gc) global.gc();
    //   } else if (document.pages) {
    //     document.pages.forEach((page) => {
    //       // eslint-disable-next-line no-unused-vars
    //       let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(page);
    //       replaceLinks = replaceLinks.concat(tmpReplaceLinks);
    //       if (global.gc) global.gc();
    //     });
    //   }
    // });
  }

  async processAdventure() {

    try {

      // ToDo
      // get metadata
      // download adventure
      // get enhanced data
      // asset copy
      // we download assets first so we can use the image sizes for rough guesses
      await this.downloadAssets();

      // the this.processRow will loop through each row and do a first pass
      // for:
      // process Journals
      // process Scenes
      // process Tables
      const db = new Database(this, this.processRow, null);
      db.getData();

      this.tableFactory.generateNoteRows(this.row);

      // finally we do some second passes to fix up links for generated images, scenes etc
      this.#fixUpAdventure();

      // we copy assets and save out generated json
      this.copyAssets();
      this.saveJson();

      // save the zip out
      this.saveZip();
    } catch (error) {
      logger.error(`Error generating adventure: ${error}`);
      logger.error(error.stack);
    } finally {
      logger.info("Generated the following journal assets:");
      logger.info(this.assets);
      logger.info("Generated the following scene images:");
      logger.info(this.sceneImages);

      this.#saveMetrics();
      if (this.config.returns.returnAdventure) {
        this.config.this.returns.returnAdventure(this);
      }
    }
  }

  getLookups(all = false) {
    logger.info("Getting lookups");
    const lookupFile = path.resolve(__dirname, this.config.lookupFile);
    if (fs.existsSync(lookupFile)){
      const data = FileHelper.loadJSONFile(lookupFile);
      if (all){
        return data ? data : {};
      } else {
        return data && data[this.bookCode] ? data[this.bookCode] : [];
      }
    } else {
      return {};
    }
  }

  #saveLookups() {
    const resolvedContent = this.getLookups(true);
    resolvedContent[this.bookCode] = this.ids;
    const configFile = path.resolve(__dirname, this.config.lookupFile);
    FileHelper.saveJSONFile(resolvedContent, configFile);
  }

  #saveImageFinderResults() {
    const imageScenePath = path.resolve(__dirname, this.config.configDir, "scene-images.json");
  
    const sceneData = (fs.existsSync(imageScenePath)) ?
      FileHelper.loadJSONFile(imageScenePath) :
      {};
    sceneData[this.bookCode] = this.imageFinder.sceneResults;
    FileHelper.saveJSONFile(sceneData, imageScenePath);
  
    const imageJournalPath = path.resolve(__dirname, this.config.configDir, "journal-images.json");
  
    const journalData = (fs.existsSync(imageJournalPath)) ?
      FileHelper.loadJSONFile(imageJournalPath) :
      {};
    journalData[this.bookCode] = this.imageFinder.journalResults;
    FileHelper.saveJSONFile(journalData, imageJournalPath);
  }
  
  loadImageFinderResults() {
    const imageScenePath = path.resolve(__dirname, this.config.configDir, "scene-images.json");
  
    const sceneData = (fs.existsSync(imageScenePath))
      ? FileHelper.loadJSONFile(imageScenePath)
      : {};
  
    this.imageFinder.sceneResults = sceneData[this.bookCode] ? sceneData[this.bookCode] : [];

    const imageJournalPath = path.resolve(__dirname, this.config.configDir, "journal-images.json");
    const journalData = (fs.existsSync(imageJournalPath))
      ? FileHelper.loadJSONFile(imageJournalPath)
      : {};

    this.imageFinder.journalResults = journalData[this.bookCode] ? journalData[this.bookCode] : [];
  }

  #saveTableData() {
    const tableDataPath = path.resolve(__dirname, this.config.configDir, "table-data.json");

    const tableData = (fs.existsSync(tableDataPath)) ?
      FileHelper.loadJSONFile(tableDataPath) :
      {};
    tableData[this.bookCode] = this.tableMatched;
    FileHelper.saveJSONFile(tableData, tableDataPath);
  }

  #saveMetrics() {
    this.#saveLookups();
    if (this.config.tableFind) {
      this.#saveTableData();
    }
    if (this.config.imageFind) {
      this.#saveImageFinderResults();
    }
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

  #outputAdventure() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir);
    }
  
    this.config.subDirs.forEach((d) => {
      if (!fs.existsSync(path.join(this.config.outputDir,d))) {
        fs.mkdirSync(path.join(this.config.outputDir,d));
      }
    });
  
    logger.info("Exporting adventure outline...");
  
    const adventure = require(path.join(this.adventure.overrides.templateDir,"adventure.json"));
    adventure.name = this.config.book.description;
    adventure.id = Helpers.randomString(10, "#aA");
    adventure.required = this.required;
  
    const adventureData = JSON.stringify(adventure);
    fs.writeFileSync(path.join(this.config.outputDir,"adventure.json"), adventureData);
  }

  #outputJournals() {
    logger.info("Exporting journal chapters...");
  
    // journals out
    this.journals.forEach((journal) => {
      fs.writeFileSync(path.join(this.config.outputDir, "journal", `${journal._id}.json`), journal.toJson());
    });
  }

  #outputScenes() {
    logger.info("Exporting scenes...");
    logger.info("Generated Scenes:");
    logger.info(this.scenes.map((s) => `${s.data.name} : ${s.data._id} : ${s.data.flags.ddb.contentChunkId } : ${s.data.flags.ddb.ddbId } : ${s.data.flags.ddb.cobaltId } : ${s.data.flags.ddb.parentId } : ${s.data.img}`));
  
    // scenes out
    this.scenes.forEach((scene) => {
      fs.writeFileSync(path.join(this.config.outputDir,"scene",`${scene._id}.json`), scene.toJson());
    });
  }
  
  
  #outputTables() {
    logger.info("Exporting tables...");
  
    // tables out
    this.tables.forEach((table) => {
      fs.writeFileSync(path.join(this.config.outputDir,"table",`${table._id}.json`), table.toJson());
    });
  }

  #hasFolderContent(folder) {
    const hasContent = this.#foldersWithContent.includes(folder._id);
    if (hasContent) return true;
  
    const childFolders = this.folders.filter((pFolder) => folder._id === pFolder.parent);
    if (!childFolders) return false;
  
    const hasChildrenWithContent = childFolders.some((childFolder) => this.folders.includes(childFolder._id));
    if (hasChildrenWithContent) return true;
  
    const hasRecursiveContent = childFolders.some((childFolder) => this.hasFolderContent(childFolder));
  
    return hasRecursiveContent;
  
  }

  get #foldersWithContent() {
    return this.folders.filter((folder) => {
      const journalCheck = this.journals.some((content) =>
        folder._id === content.data.folder ||
        this.masterFolder[folder.type]._id == folder._id
      );
      if (journalCheck) return true;
      const sceneCheck = this.scenes.some((content) =>
        folder._id === content.data.folder ||
        this.masterFolder[folder.type]._id == folder._id
      );
      if (sceneCheck) return true;
      const tableCheck = this.tables.some((content) =>
        folder._id === content.data.folder ||
        this.masterFolder[folder.type]._id == folder._id
      );
      if (tableCheck) return true;
    }).map((folder) => folder._id);
  }

  #outputFolders() {
    logger.info("Exporting required folders...");
    const finalFolders = this.folders.filter((folder) => this.#hasFolderContent(folder));
    const foldersData = JSON.stringify(finalFolders);
    fs.writeFileSync(path.join(this.config.outputDir,"folders.json"), foldersData);
  }

}


exports.Adventure = Adventure;
