const logger = require("../logger.js");
const path = require("path");
const fs = require("fs");
const { exit } = require("process");
const _ = require("lodash");

const ddb = require("../data/ddb.js");
const enhance = require("../data/enhance.js");
const { FileHelper } = require("./FileHelper.js");

class Config {

  static TIMEOUT = 15000;
  static ENHANCEMENT_ENDPOINT = "https://proxy.ddb.mrprimate.co.uk";
  static DEFAULT_CONFIG_DIR = "../dbs";

  setDataConfigSetting(settingName, defaultValue) {
    const value = this.options[settingName] !== undefined
      ? this.options[settingName]
      : this.data[settingName] !== undefined
        ? this.data[settingName]
        : defaultValue;
  
    this.data[settingName] = value;
  }

  fakeReturns() {
    return;
  }

  setConfigDirs(configDir) {
    this.configDir = configDir;
    this.dbDir = `${configDir}/content`;
    this.buildDir = `${configDir}/build`;
    this.metaDir = `${configDir}/meta`;
    this.configFile = path.resolve(__dirname, `${configDir}/config.json`);

    this.scenesDir = path.resolve(__dirname, path.join(this.metaDir, "scene_info"));
    this.notesDir = path.resolve(__dirname, path.join(this.metaDir, "note_info"));
    this.assetsDir = path.resolve(__dirname, path.join(this.metaDir, "assets"));
    this.tablesDir = path.resolve(__dirname, path.join(this.metaDir, "table_info"));
    const directories = [
      this.configDir,
      this.buildDir,
      this.metaDir,
      this.scenesDir,
      this.notesDir,
      this.assetsDir,
      this.tablesDir,
    ];
    FileHelper.checkDirectories(directories);
  }

  #environmentOverrides() {
    if (process.env.DB_DIR) {
      this.dbsDir = process.env.DB_DIR;
    } else if (this.options.dbsDir) {
      this.dbsDir = this.options.dbsDir;
    } else {
      this.dbsDir = this.dbDir;
    }
    this.downloadDir = path.resolve(__dirname, this.dbsDir);
    this.metaInfoDir = (process.env.META_DIR) ? path.resolve(__dirname, process.env.META_DIR) : path.resolve(__dirname, this.metaDir);
    this.sceneInfoDir = (process.env.SCENE_DIR) ? path.resolve(__dirname,process.env.SCENE_DIR) : path.resolve(__dirname, this.scenesDir);
    this.noteInfoDir = (process.env.NOTE_DIR) ? path.resolve(__dirname,process.env.NOTE_DIR) : path.resolve(__dirname, this.notesDir);
    this.assetsInfoDir = (process.env.ASSETS_DIR) ? path.resolve(__dirname,process.env.ASSETS_DIR) : path.resolve(__dirname, this.assetsDir);
    this.tableInfoDir = (process.env.TABLE_DIR) ? path.resolve(__dirname,process.env.TABLE_DIR) : path.resolve(__dirname, this.tablesDir);
    this.enhancementEndpoint = (process.env.ENDPOINT) ? process.env.ENDPOINT : Config.ENHANCEMENT_ENDPOINT; 
    this.debug = (process.env.DEBUG) ? process.env.DEBUG : false; 
  
    if (this.debug) {
      logger.debug(`DownloadDir ${this.downloadDir}`); 
      logger.debug(`MetaInfoDir ${this.metaInfoDir}`); 
      logger.debug(`SceneInfoDir ${this.sceneInfoDir}`);
      logger.debug(`NoteInfoDir ${this.noteInfoDir}`);
      logger.debug(`TableInfoDir ${this.tableInfoDir}`);
      logger.debug(`AssetsInfoDir ${this.assetsInfoDir}`);
    }
  }

  #setDefaultConfig() {
    const v4Schema = Number.parseFloat(this.data.schemaVersion) >= 4.0;
    this.setDataConfigSetting("schemaVersion", 3.0);
    this.setDataConfigSetting("createHandouts", !v4Schema);
    this.setDataConfigSetting("createPlayerHandouts", !v4Schema);
    this.setDataConfigSetting("observeAll", false);
    this.setDataConfigSetting("createSections", !v4Schema);
    this.setDataConfigSetting("logLevel", "info");
    this.data.subDirs = [
      "journal",
      // "compendium",
      "scene",
      "table",
    ];
  }

  #loadExternalConfig() {
    if (this.options.externalConfigFile) {
      const externalConfigPath = path.resolve(__dirname, this.options.externalConfigFile);
      if (fs.existsSync(externalConfigPath)){
        logger.info(`Getting External Config file ${this.options.externalConfigFile}`);
        const externalConfig = FileHelper.loadConfig(externalConfigPath);
        delete(this.data.cobalt);
        delete(this.data.lookups);
        this.data = _.merge(this.data, externalConfig);
      }
    }
  }

  async getMetaData() {
    // only grab remote data if we are not providing a SCENE_DIR as we want to act on the local one
    this.returns.statusMessage("Checking Meta Data");
    const remoteMetaDataVersion = process.env.SCENE_DIR ? "0.0.0" : await enhance.getMetaData(this);
    if (!this.data.metaDataVersion || remoteMetaDataVersion != this.data.metaDataVersion) {
      this.data.metaDataVersion = remoteMetaDataVersion;
    }
  }

  async loadBook(bookCode) {
    this.bookCode = bookCode.toLowerCase();
    await this.getMetaData();
  
    // Checking user and authentication
    this.userData = await ddb.getUserData(this.data.cobalt);
  
    if (this.userData.status !== "success") {
      logger.info(this.userData);
      logger.warn("Unable to determine DDB user");
      throw new Error(this.userData);
    }

    this.ddbConfig = await ddb.getDDBConfig();
    this.book = this.ddbConfig.sources.find((source) => source.name.toLowerCase() === bookCode);
    if (!this.book) {
      throw new Error(`Unable to find a book match for ${bookCode}. Adventure Muncher may need an update, or this book may not be ready for munching yet.`);
    }
    if (!this.book.id) {
      logger.info(`Book ${bookCode} not found`);
      exit(1);
    }
    this.sourceDir = path.resolve(__dirname, path.join(this.dbsDir, bookCode));
    this.outputDir = path.resolve(__dirname, path.join(this.buildDir, bookCode));
  
    logger.info(`Saving adventures to ${this.outputDir}`);
    logger.info(`Pulling ${this.book.description} (${bookCode}) off the shelf...`);
  
    const versionsFile = path.resolve(__dirname, path.join(this.metaInfoDir, "versions.json"));
    logger.info(`Supported versions file ${versionsFile}`);

    const metaPath = path.join(this.metaDir, "meta.json");
    logger.info(`Meta data file ${metaPath}`);

    const versionsFileExists = fs.existsSync(versionsFile);
    const metaFileExists = fs.existsSync(metaPath);
  
    this.ddbVersions = {
      downloadNewVersion: false,
      currentVersion: 0,
      supportedVersion: 0,
      updateAvailable: false
    };

    let versions = {};
    versions[bookCode] = this.ddbVersions.currentVersion;
  
    if (fs.existsSync(this.sourceDir)) {
      logger.warn("LOADING CURRENT VERSION");
      const downloadedVersionPath = path.resolve(__dirname, path.join(this.sourceDir, "version.txt"));
      const existingVersionContent = FileHelper.loadFile(downloadedVersionPath);
      this.ddbVersions.currentVersion = parseInt(existingVersionContent.trim());
      const latest = await ddb.checkLatestBookVersion(this.book.id, this.data.cobalt, this.ddbVersions.currentVersion);
      logger.warn(latest);
      if (latest.sourceUpdatesAvailable[this.book.id]) {
        this.ddbVersions.updateAvailable = true;
      }
    }
  
    if (versionsFileExists){
      logger.warn("LOADING VERSIONS");
      versions = FileHelper.loadConfig(versionsFile);
      if (versions[bookCode]) this.ddbVersions.supportedVersion = versions[bookCode];
    } else if (!versionsFileExists || !metaFileExists) {
      if (!versionsFileExists) logger.error("Can't find versions file.");
      if (!metaFileExists) logger.error("Can't find meta file.");
      this.returns.statusMessage("Can't find meta file.");
      logger.error("Meta data probably didn't download, please fix manually.");
      logger.info(`You can manually download the data from https://github.com/MrPrimate/ddb-meta-data/releases/latest and extract to ${this.metaDir} this should have things like the following in afterwards:`);
      logger.info("assets ddb-meta-data.zip  LICENSE.md  meta.json  note_info  scene_info  table_info  versions.json");
      exit();
    }
  
    const bookZipPath = path.join(this.downloadDir, `${bookCode}.zip`);
  
    // if an update is available and we _think_ it is supported (we don't know till we grab it)
    // delete and redownload
    this.ddbVersions.downloadNewVersion = this.ddbVersions.updateAvailable &&
      this.ddbVersions.supportedVersion > this.ddbVersions.currentVersion;
    if (this.ddbVersions.downloadNewVersion) {
      if (fs.existsSync(bookZipPath)) {
        fs.rmSync(bookZipPath);
      }
    }
  
    if (!fs.existsSync(bookZipPath)){
      logger.info(`Downloading ${this.book.description} ... this might take a while...`);
      this.returns.statusMessage(`Downloading ${this.book.description}`);
      await ddb.downloadBook(this.book.id, this.data.cobalt, bookZipPath, this.downloadTimeout);
      logger.info("Download finished, beginning book parse!");
    }
  
    if (!fs.existsSync(this.sourceDir) || this.ddbVersions.downloadNewVersion){
      logger.info(`Having to unzip, targeting ${this.sourceDir}`);
      this.returns.statusMessage(`Unzipping ${this.book.description}`);
      await FileHelper.unzipFile(bookZipPath, this.sourceDir);
    }
  
    // reload current version
    if ((this.ddbVersions.currentVersion === 0 || this.ddbVersions.downloadNewVersion) && fs.existsSync(this.sourceDir)) {
      const downloadedVersionPath = path.resolve(__dirname, path.join(this.sourceDir, "version.txt"));
      const existingVersionContent = FileHelper.loadFile(downloadedVersionPath);
      this.ddbVersions.currentVersion = parseInt(existingVersionContent.trim());
    }
  
    // update supported version to current? (dev mode activity)
    if (this.data.updateVersions){
      logger.warn("SAVING VERSIONS");
      versions[bookCode] = this.ddbVersions.currentVersion;
      FileHelper.saveJSONFile(versions, versionsFile);
    }
  
    logger.info(`Current version: ${this.ddbVersions.currentVersion}`);
    logger.info(`Supported version: ${this.ddbVersions.supportedVersion}`);
    logger.info(`Downloaded new: ${this.ddbVersions.downloadNewVersion}`);
  
    // generate book runtime config
    this.key = await ddb.getKey(this.book.id, this.data.cobalt);
    this.outputDirEnv = path.resolve(__dirname, this.data.outputDirEnv);
    this.scenesBookDir = path.join(this.sceneInfoDir, bookCode);

    if (this.data.debug) {
      logger.debug("================================");
      logger.debug("DEBUG CONFIG");
      logger.debug(this.data);
      logger.debug("CONFIG RUNTIME");
      logger.debug(this);
      logger.debug("================================");
    }
  
  }

  constructor(options = {}) {
    this.options = options;
    this.version = options.version || null;
    // this.returns = options.returns || {
    //   statusMessage: this.fakeReturns,
    //   returnAdventure: this.fakeReturns,
    // };
    if (!options.returns) {
      this.returns = {
        statusMessage: this.fakeReturns,
        returnAdventure: this.fakeReturns,
      };
    }
    this.returns = options.returns;
    const configDir = (process.env.CONFIG_DIR)
      ? process.env.CONFIG_DIR
      : options.configDir 
        ? options.configDir
        : Config.DEFAULT_CONFIG_DIR;
    logger.info(`Using initial config directory ${configDir}`);
    this.setConfigDirs(configDir);
    // override config with environment vars
    this.#environmentOverrides();

    logger.info(`Config Directory is now ${this.configDir}`);

    this.data = FileHelper.loadConfig(this.configFile);
    if (this.data.run) delete(this.data.run);

    this.downloadTimeout = this.data.downloadTimeout ? this.data.downloadTimeout : Config.TIMEOUT;
    
    this.#loadExternalConfig();
  
    if (options.outputDirPath) {
      options.outputDirPath = path.resolve(__dirname,options.outputDirPath);
      if (fs.existsSync(options.outputDirPath)){
        this.data.outputDirEnv = options.outputDirPath;
      }
    }

    this.#setDefaultConfig();
    FileHelper.checkDirectories([this.downloadDir]);

    // save config
    FileHelper.saveJSONFile(this.data, this.configFile);
    
    if (this.data.debug) {
      logger.setLogLevel("silly");
    } else {
      logger.setLogLevel(this.data.logLevel);
    }
  }

  
}

exports.Config = Config;
