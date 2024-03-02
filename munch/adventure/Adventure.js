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
const { Helpers } = require("./Helpers.js");
const { getEnhancedData } = require("../data/enhance.js");

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const os = require("os");
const _ = require("lodash");


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

  async loadEnhancements() {
    this.enhancements.sceneEnhancements = await getEnhancedData(this.config);
  }

  loadHints() {
    this.loadNoteHints();
    this.loadTableHints();
    this.loadSceneAdjustments();

    logger.debug("Current config adjustments", {
      sceneAdjustments: this.enhancements.sceneAdjustments.length,
      sceneEnhancements: this.enhancements.sceneEnhancements.length,
      noteHints: this.enhancements.noteHints.length,
      tableHints: this.enhancements.tableHints.length,
    });
  }

  constructor(config, overrides = {}) {
    logger.info(`Adventure Muncher version ${config.version}`);
    logger.info(`Starting Adventure instance for ${config.bookCode}`);
    this.config = config;

    const defaultOverrides = {
      templateDir: path.resolve(__dirname, path.join("../../", "content", "templates")),
    };

    this.overrides = _.merge(defaultOverrides, overrides);
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

    // catches un journaled assets like pdf files
    this.otherFiles = [];

    this.enhancements = {
      noteHints: [],
      tableHints: [],
      sceneAdjustments: [],
      sceneEnhancements: [],
      hiRes: [],
    };

    this.imageFinder = {
      scenes: [],
      journals: [],
    };

    this.bad = {
      notes: [],
    };

    // load adventure data skeleton
    this.data = require(path.join(this.overrides.templateDir, "adventure.json"));
    this.data.name = this.config.book.description;
    this.data.id = Helpers.randomString(10, "#aA");
    this.required = {
      monsters: new Set(),
      monsterData: new Set(),
      items: new Set(),
      spells: new Set(),
      vehicles: new Set(),
      skills: new Set(),
      senses: new Set(),
      conditions: new Set(),
      actions: new Set(),
      weaponproperties: new Set(),
    };
    this.data.required = {};
    this.data.version = parseFloat(this.config.data.schemaVersion);
    this.supports = {
      pages: true,
    };

    this.replaceLinks = [];
    this.tempHandouts = [];
    this.ids = this.getLookups(false);

    // create global factories
    this.idFactory = new IdFactory(this);
    this.folderFactory = new FolderFactory(this);
    this.notesFactory = new NoteFactory(this);

    this.tableFactory = new TableFactory(this);
    this.journalFactory = new JournalFactory(this);
    this.sceneFactory = new SceneFactory(this);

    this.assetFactory = new Assets(this);

    // initialize master folders
    this.folderFactory.generateMasterFolders();

    // has returns?
    this.returns = config.returns;

  }

  #mockMonsterCreation() {
    logger.debug(`Generating mock actor data now for ${this.required.monsters.size} monsters`);
    this.data.required.monsterData = [...this.required.monsters]
      .map((ddbId) => {
        const mockActor = {
          flags: {
            ddb: {
              contentChunkId: parseInt(ddbId),
              ddbId: `DDB-Monster-${ddbId}`,
              cobaltId: null,
              parentId: null,
            },
          },
          type: "Actor",
        };

        const mockData = {
          actorId: this.idFactory.getId(mockActor, "Actor"),
          ddbId: parseInt(ddbId),
          folderId: this.folderFactory.masterFolders["Actor"]._id
        };

        return mockData;
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
    logger.info(`Processing DB Row: ${row.data.id} : ${row.data.title}`);
    if (this.returns) this.returns.statusMessage(`Processing DB Row: ${row.data.id} : ${row.data.title}`);

    const existingJournal = this.journals.some((f) => f.data.flags.ddb.ddbId == row.data.id);

    if (!existingJournal){
      logger.info(`Generating Journal for ${row.data.title}`);
      const journal = this.journalFactory.createJournal(row);
      logger.info(`Row name now: ${row.data.title}`);
      if (global.gc) global.gc();

      logger.info(`Generating tables for ${row.data.title}`);
      this.tableFactory.generateTables(row);
      if (global.gc) global.gc();

      // if this is a top tier parent document we process it for scenes now.
      const content = journal.data.pages[0];
      // if (content && journal.data.flags.ddb.cobaltId) {
      if (content) {
        logger.info(`Finding Scenes for ${row.data.title}`);
        this.sceneFactory.findScenes(row, content);
      }
      if (global.gc) global.gc();
    } else {
      logger.error(`Duplicate row parse attempted for ${row.data.id}`);
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

  writeFixes() {
    if (this.config.data.generateFixes) {
      logger.info("Generating fix files");
      this.notesFactory.writeFixes();
      this.sceneFactory.writeFixes();
    }
  }

  async processAdventure() {

    try {
      // reset build directories
      FileHelper.directoryReset(this.config);
      // we download assets first so we can use the image sizes for rough guesses
      await this.downloadAssets();
      // get enriched data hints
      await this.loadEnhancements();
      // load up hint data
      this.loadHints();

      // the this.processRow will loop through each row and do a first pass
      // for:
      // process Journals
      // process Scenes
      // process Tables
      const db = new Database(this);
      db.getData();

      // we do some second passes to fix up links for generated images, scenes etc
      this.#fixUpAdventure();

      // link notes to scenes
      this.sceneFactory.addNotes();

      // generate mock actors
      this.#mockMonsterCreation();

      // we copy assets and save out generated json
      await this.downloadEnhancementAssets();
      this.copyAssets();
      this.saveJson();
      this.writeFixes();

      // save the zip out
      await this.saveZip();

    } catch (error) {
      logger.error(`Error generating adventure: ${error}`);
      logger.error(error.stack);
    } finally {
      logger.info("Generated the following journal assets:");
      logger.info(this.assets);
      logger.info("Generated the following scene images:");
      logger.info(this.sceneImages);
      if (this.bad.notes.length > 0) {
        logger.error("Bad notes found");
        this.bad.notes.forEach((note) => {
          logger.warn(note);
        });
      }

      this.#saveMetrics();
      if (this.returns) {
        this.returns.returnAdventure(this);
      }
    }
  }

  getLookups(all = false) {
    logger.info("Getting lookups");
    const lookupFile = path.resolve(__dirname, this.config.configDir, "lookupPages.json");
    if (fs.existsSync(lookupFile)){
      const data = FileHelper.loadJSONFile(lookupFile);
      if (all){
        return data ? data : {};
      } else {
        return data && data[this.bookCode] ? data[this.bookCode] : [];
      }
    } else {
      return all ? {} : [];
    }
  }

  #saveLookups() {
    const resolvedContent = this.getLookups(true);
    resolvedContent[this.bookCode] = this.ids;
    const lookupFile = path.resolve(__dirname, this.config.configDir, "lookupPages.json");
    FileHelper.saveJSONFile(resolvedContent, lookupFile);
  }

  #saveImageFinderResults() {
    const imageScenePath = path.resolve(__dirname, this.config.configDir, "scene-images.json");
  
    const sceneData = (fs.existsSync(imageScenePath))
      ? FileHelper.loadJSONFile(imageScenePath)
      : {};
    logger.debug(`Saving ${this.imageFinder.scenes.length} scenes`);
    sceneData[this.bookCode] = this.imageFinder.scenes;
    FileHelper.saveJSONFile(sceneData, imageScenePath);
  
    const imageJournalPath = path.resolve(__dirname, this.config.configDir, "journal-images.json");
  
    const journalData = (fs.existsSync(imageJournalPath))
      ? FileHelper.loadJSONFile(imageJournalPath)
      : {};
    journalData[this.bookCode] = this.imageFinder.journals;
    FileHelper.saveJSONFile(journalData, imageJournalPath);
  }

  getImageFinderResults(type) {
    const imagePath = path.resolve(__dirname, this.config.configDir, `${type}-images.json`);
  
    const data = (fs.existsSync(imagePath))
      ? FileHelper.loadJSONFile(imagePath)
      : {};
  
    return data[this.bookCode] ? data[this.bookCode] : [];
  }

  loadImageFinderResults() {
    ["scene", "journal"].forEach((type) => {
      this.imageFinder[`${type}s`] = this.getImageFinderResults(type);
    });
  }

  #saveTableData() {
    const tableDataPath = path.resolve(__dirname, this.config.configDir, "table-data.json");

    const tableData = (fs.existsSync(tableDataPath))
      ? FileHelper.loadJSONFile(tableDataPath)
      : {};
    tableData[this.bookCode] = this.tableMatched;
    FileHelper.saveJSONFile(tableData, tableDataPath);
  }

  #saveMetrics() {
    this.#saveLookups();
    if (this.config.data.tableFind) {
      this.#saveTableData();
    }
    if (this.config.data.imageFind) {
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
    await this.assetFactory.downloadDDBMobile();
  }

  async downloadEnhancementAssets() {
    await this.assetFactory.downloadEnhancements(this.downloadList);
  }

  copyAssets() {
    this.assetFactory.finalAssetCopy();
  }

  async saveZip() {
    await this.assetFactory.generateZipFile();
  }

  #outputAdventure() {

    this.data.required.monsters = [...this.required.monsters];
    this.data.required.items = [...this.required.items];
    this.data.required.spells = [...this.required.spells];
    this.data.required.vehicles = [...this.required.vehicles];
    this.data.required.skills = [...this.required.skills];
    this.data.required.senses = [...this.required.senses];
    this.data.required.conditions = [...this.required.conditions];
    this.data.required.actions = [...this.required.actions];
    this.data.required.weaponproperties = [...this.required.weaponproperties];

    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir);
    }
  
    this.config.data.subDirs.forEach((d) => {
      if (!fs.existsSync(path.join(this.config.outputDir,d))) {
        fs.mkdirSync(path.join(this.config.outputDir,d));
      }
    });
  
    logger.info("Exporting adventure outline...");

    const adventureData = JSON.stringify(this.data);
    fs.writeFileSync(path.join(this.config.outputDir,"adventure.json"), adventureData);
  }

  #outputJournals() {
    logger.info(`Exporting ${this.journals.length} journals...`);
  
    // journals out
    this.journals.forEach((journal) => {
      const filePath = path.join(this.config.outputDir, "journal", `${journal.id}.json`);
      logger.info({
        title: journal.row.data.title,
        ddbId: journal.data.flags.ddb.ddbId,
        name: journal.data.name,
        id: journal.id,
        path: filePath,
        pages: journal.data.pages?.length ?? "No Pages"
      });
      const pagesNoContent = journal.data.pages
        ? journal.data.pages
          .filter(s => s.type === "text")
          .filter(s => s.text.content.trim() === "")
          .map(s => {
            return {
              name: s.name,
              content: s.text.content,
            };
          })
        : [];
      if (pagesNoContent.length > 0) logger.error("missing pages", pagesNoContent);
      fs.writeFileSync(filePath, journal.toJson());
    });
  }

  #outputScenes() {
    logger.info("Generated Scenes:");
    logger.info(this.scenes.map((s) => `${s.data.name} : ${s.id} : ${s.data.flags.ddb.contentChunkId } : ${s.data.flags.ddb.ddbId } : ${s.data.flags.ddb.cobaltId } : ${s.data.flags.ddb.parentId } : ${s.image}`));

    logger.info(`Exporting ${this.scenes.length} scenes...`);

    // scenes out
    this.scenes.forEach((scene) => {
      logger.debug(`Exporting Scene ${scene.data.name} with id "${scene.id}"`);
      const filePath = path.join(this.config.outputDir,"scene",`${scene.id}.json`);
      logger.info({
        name: scene.data.name,
        id: scene.id,
        path: filePath,
      });
      fs.writeFileSync(filePath, scene.toJson());
    });

    logger.debug("Scene export complete");

  }
  
  
  #outputTables() {
    logger.info("Exporting tables...");
  
    // tables out
    this.tables.forEach((table) => {
      const filePath = path.join(this.config.outputDir,"table",`${table.id}.json`);
      logger.info({
        name: table.data.name,
        id: table.id,
        path: filePath,
      });
      fs.writeFileSync(filePath, table.toJson());
    });
  }

  #hasFolderContent(folder) {
    // console.warn(folder);
    const hasContent = this.#foldersWithContent.includes(folder._id);
    // console.warn({folder, hasContent})
    if (hasContent) return true;
  
    const childFolders = this.folders.filter((pFolder) => folder._id === pFolder.parent);
    // console.warn({folder, childFolders})
    if (!childFolders) return false;
  
    const hasChildrenWithContent = childFolders.some((childFolder) => this.folders.includes(childFolder._id));
    // console.warn({folder, hasChildrenWithContent})
    if (hasChildrenWithContent) return true;
  
    const hasRecursiveContent = childFolders.some((childFolder) => this.#hasFolderContent(childFolder));
    // console.warn(hasRecursiveContent)
  
    return hasRecursiveContent;
  
  }

  get #foldersWithContent() {
    return this.folders.filter((folder) => {
      const journalCheck = this.journals.some((content) =>
        folder._id === content.data.folder
        || this.folderFactory.masterFolders[folder.type]._id == folder._id
      );
      if (journalCheck) return true;
      const sceneCheck = this.scenes.some((content) =>
        folder._id === content.data.folder
        || this.folderFactory.masterFolders[folder.type]._id == folder._id
      );
      if (sceneCheck) return true;
      const tableCheck = this.tables.some((content) =>
        folder._id === content.data.folder
        || this.folderFactory.masterFolders[folder.type]._id == folder._id
      );
      if (tableCheck) return true;
      if (folder.flags.ddb.specialType === "base") return true;
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
