const utils = require("./utils.js");
const path = require("path");
const ddb = require("./ddb.js");
const enhance = require("./enhance.js");
const { exit } = require("process");
const fs = require("fs");
const _ = require("lodash");
const logger = require("./logger.js");

var configDir = "../dbs";
var buildDir = `${configDir}/build`;
var metaDir = `${configDir}/meta`;
var dbDir;
var CONFIG_FILE = `${configDir}/config.json`;
var LOOKUP_FILE = `${configDir}/lookup.json`;
var config;

const defaultEnhancementEndpoint = "https://proxy.ddb.mrprimate.co.uk";

function setConfigDir (dir) {
  configDir = dir;
  dbDir = `${configDir}/content`;
  buildDir = `${configDir}/build`;
  metaDir = `${configDir}/meta`;
  CONFIG_FILE = `${configDir}/config.json`;
  LOOKUP_FILE = `${configDir}/lookup.json`;
}

function getLookups() {
  const lookupFile = path.resolve(__dirname, LOOKUP_FILE);
  if (fs.existsSync(lookupFile)){
    return utils.loadJSONFile(lookupFile);
  } else {
    return {};
  }
}

function saveLookups(content) {
  const configFile = path.resolve(__dirname, LOOKUP_FILE);
  utils.saveJSONFile(content, configFile);
}

function saveImageFinderResults(sceneContent, journalContent, bookCode) {
  const imageScenePath = path.resolve(__dirname,configDir,"scene-images.json");

  const sceneData = (fs.existsSync(imageScenePath)) ?
    utils.loadJSONFile(imageScenePath) :
    {};
  sceneData[bookCode] = sceneContent;
  utils.saveJSONFile(sceneData, imageScenePath);

  const imageJournalPath = path.resolve(__dirname,configDir,"journal-images.json");

  const journalData = (fs.existsSync(imageJournalPath)) ?
    utils.loadJSONFile(imageJournalPath) :
    {};
  journalData[bookCode] = journalContent;
  utils.saveJSONFile(journalData, imageJournalPath);
}

function loadImageFinderResults(type, bookCode) {
  const imageScenePath = path.resolve(__dirname,configDir,`${type}-images.json`);

  const data = (fs.existsSync(imageScenePath)) ?
    utils.loadJSONFile(imageScenePath) :
    { bookCode: [] };

  logger.info("loaded image file");

  return data[bookCode];

}

function saveTableData(content, bookCode) {
  const tableDataPath = path.resolve(__dirname,configDir,"table-data.json");

  const tableData = (fs.existsSync(tableDataPath)) ?
    utils.loadJSONFile(tableDataPath) :
    {};
  tableData[bookCode] = content;
  utils.saveJSONFile(tableData, tableDataPath);
}

function isConfig() {
  const config = getConfig();
  if (config.cobalt) return true;
  return false;
}

// const options = {
//   bookCode: null,
//   externalConfigFile: null,
//   outputDirPath: null,
// };
async function getConfig(options = {}) {
  let saveConf = false;
  const configFile = path.resolve(__dirname, CONFIG_FILE);
  if (!config) config = utils.loadConfig(configFile);
  if (config.run) delete(config.run);

  if (!fs.existsSync(configDir)){
    fs.mkdirSync(configDir);
  }
  if (!fs.existsSync(buildDir)){
    fs.mkdirSync(buildDir);
  }
  if (!fs.existsSync(metaDir)){
    fs.mkdirSync(metaDir);
  }
  let scenesDir = path.resolve(__dirname, path.join(metaDir, "scene_info"));
  if (!fs.existsSync( scenesDir)){
    fs.mkdirSync(scenesDir);
  }
  let notesDir = path.resolve(__dirname, path.join(metaDir, "note_info"));
  if (!fs.existsSync(notesDir)){
    fs.mkdirSync(notesDir);
  }

  if (options.externalConfigFile) {
    const externalConfigPath = path.resolve(__dirname, options.externalConfigFile);
    if (fs.existsSync(externalConfigPath)){
      logger.info(`Getting External Config file ${options.externalConfigFile}`);
      const externalConfig = utils.loadConfig(externalConfigPath);
      delete(config.cobalt);
      delete(config.lookups);
      config = _.merge(config, externalConfig);
      saveConf = true;
    }
  }

  if (options.outputDirPath) {
    options.outputDirPath = path.resolve(__dirname,options.outputDirPath);
    if (fs.existsSync(options.outputDirPath)){
      config.outputDirEnv = options.outputDirPath;
      saveConf = true;
    }
  }

  if (
    (options.generateTokens === true || options.generateTokens === false) &&
    config.generateTokens !== options.generateTokens
  ) {
    config.generateTokens = options.generateTokens;
    saveConf = true;
  }

  if (
    (options.observeAll === true || options.observeAll === false) &&
    config.observeAll !== options.observeAll
  ) {
    config.observeAll = options.observeAll;
    saveConf = true;
  }

  if (saveConf) {
    utils.saveJSONFile(config, configFile);
  }

  let dbsDir;
  if (config.dbsDir) {
    dbsDir = config.dbsDir;
  } else if (process.env.DB_DIR) {
    dbsDir = process.env.DB_DIR;
  } else {
    dbsDir = dbDir;
  }
  const downloadDir = path.resolve(__dirname, dbsDir);
  const metaInfoDir = (process.env.META_DIR) ? process.env.META_DIR : path.resolve(__dirname, metaDir);
  const sceneInfoDir = (process.env.SCENE_DIR) ? process.env.SCENE_DIR : path.resolve(__dirname, scenesDir);
  const noteInfoDir = (process.env.NOTE_DIR) ? process.env.NOTE_DIR : path.resolve(__dirname, notesDir);
  const tableInfoDir = (process.env.TABLE_DIR) ? process.env.TABLE_DIR : path.resolve(__dirname, notesDir);
  const enhancementEndpoint = (process.env.ENDPOINT) ? process.env.ENDPOINT : defaultEnhancementEndpoint; 

  if (config.debug) {
    logger.debug(`DownloadDir ${downloadDir}`); 
    logger.debug(`MetaInfoDir ${metaInfoDir}`); 
    logger.debug(`SceneInfoDir ${sceneInfoDir}`);
    logger.debug(`NoteInfoDir ${noteInfoDir}`);
    logger.debug(`TableInfoDir ${tableInfoDir}`);
  }

  if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
  }

  config.run = {
    enhancementEndpoint: enhancementEndpoint,
    downloadDir: downloadDir,
    metaDir: path.resolve(__dirname, metaInfoDir),
    sceneInfoDir: path.resolve(__dirname, sceneInfoDir),
    noteInfoDir: path.resolve(__dirname, noteInfoDir),
    tableInfoDir: path.resolve(__dirname, tableInfoDir),
  };


  if (!options.bookCode) {
    return config;
  }

  // only grab remote data if we are not providing a SCENE_DIR as we want to act on the local one
  const remoteMetaDataVersion = process.env.SCENE_DIR ? "0.0.0" : await enhance.getMetaData(config);
  if (!config.metaDataVersion || remoteMetaDataVersion != config.metaDataVersion) {
    config.metaDataVersion = remoteMetaDataVersion;
    utils.saveJSONFile(config, configFile);
  }

  // Checking user and authentication
  const userData = await ddb.getUserData(config.cobalt);

  if (userData.status !== "success") {
    logger.info(userData);
    logger.warn("Unable to determine DDB user");
    exit();
  }

  options.bookCode = options.bookCode.toLowerCase();
  config.run.ddb_config = await ddb.getDDBConfig();
  const book = config.run.ddb_config.sources.find((source) => source.name.toLowerCase() === options.bookCode);
  if (!book) {
    throw new Error(`Unable to find a book match for ${options.bookCode}.`);
  }
  if (!book.id) {
    logger.info(`Book ${options.bookCode} not found`);
    exit();
  }
  let sourceDir = path.resolve(__dirname, path.join(dbsDir, options.bookCode));
  let outputDir = path.resolve(__dirname, path.join(buildDir, options.bookCode));

  config.subDirs = [
    "journal",
    // "compendium",
    "scene",
    "table",
  ];

  logger.info(`Saving adventures to ${outputDir}`);

  logger.info(`Pulling ${book.description} (${options.bookCode}) off the shelf...`);

  const versionsFile = path.resolve(__dirname, path.join(metaInfoDir, "versions.json"));
  logger.info(`Supported versions file ${versionsFile}`);
  let currentVersion = 0;
  let supportedVersion = 0;
  let updateAvailable = false;
  let downloadNewVersion = false;
  let versions = {};
  versions[options.bookCode] = currentVersion;

  if (fs.existsSync(sourceDir)) {
    logger.warn("LOADING CURRENT VERSION");
    const downloadedVersionPath = path.resolve(__dirname, path.join(sourceDir, "version.txt"));
    const existingVersionContent = utils.loadFile(downloadedVersionPath);
    currentVersion = parseInt(existingVersionContent.trim());
    const latest = await ddb.checkLatestBookVersion(book.id, config.cobalt, currentVersion);
    logger.warn(latest);
    if (latest.sourceUpdatesAvailable[book.id]) {
      updateAvailable = true;
    }
  }

  if (fs.existsSync(versionsFile)){
    logger.warn("LOADING VERSIONS");
    versions = utils.loadConfig(versionsFile);
    if (versions[options.bookCode]) supportedVersion = versions[options.bookCode];
  }

  const bookZipPath = path.join(downloadDir, `${options.bookCode}.zip`);

  // if an update is available and we _think_ it is supported (we don't know till we grab it)
  // delete and redownload
  downloadNewVersion = updateAvailable && supportedVersion > currentVersion;
  if (downloadNewVersion) {
    if (fs.existsSync(bookZipPath)) {
      fs.rmSync(bookZipPath);
    }
    if (fs.existsSync(sourceDir)) {
      fs.rmdir(sourceDir, { recursive: true }, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }

  if (!fs.existsSync(bookZipPath)){
    logger.info(`Downloading ${book.description} ... this might take a while...`);
    await ddb.downloadBook(book.id, config.cobalt, bookZipPath);
    logger.info("Download finished, beginning book parse!");
  }

  if (!fs.existsSync(sourceDir)){
    logger.info(`Having to unzip, targeting ${sourceDir}`);
    await utils.unzipFile(bookZipPath, sourceDir);
  }

  // reload current version
  if ((currentVersion === 0 || downloadNewVersion) && fs.existsSync(sourceDir)) {
    const downloadedVersionPath = path.resolve(__dirname, path.join(sourceDir, "version.txt"));
    const existingVersionContent = utils.loadFile(downloadedVersionPath);
    currentVersion = parseInt(existingVersionContent.trim());
  }

  // update supported version to current? (dev mode activity)
  if (config.updateVersions){
    logger.warn("SAVING VERSIONS");
    versions[options.bookCode] = currentVersion;
    utils.saveConfig(versions, versionsFile);
  }

  logger.info(`Current version: ${currentVersion}`);
  logger.info(`Supported version: ${supportedVersion}`);
  logger.info(`Downloaded new: ${downloadNewVersion}`);

  // generate book runtime config
  config.run.userData = userData;
  config.run.key = await ddb.getKey(book.id, config.cobalt);
  config.run.book = book;
  config.run.bookCode = options.bookCode;
  config.run.outputDir = outputDir;
  config.run.sourceDir = sourceDir;
  config.run.outputDirEnv = path.resolve(__dirname, config.outputDirEnv);
  config.run.scenesBookDir = path.join(config.run.sceneInfoDir, options.bookCode);
  config.run.version = options.version;
  config.run.ddbVersions = {
    downloadNewVersion,
    currentVersion,
    supportedVersion,
    updateAvailable
  };
  config.run.required = {
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


  if (config.debug) {
    logger.debug("================================");
    logger.debug("DEBUG CONFIG");
    logger.debug(config);
    logger.debug("CONFIG RUNTIME");
    logger.debug(config.run);
    logger.debug("================================");
  }

  return config;
}

exports.isConfig = isConfig;
exports.getConfig = getConfig;
exports.getLookups = getLookups;
exports.saveLookups = saveLookups;
exports.setConfigDir = setConfigDir;
exports.saveImageFinderResults = saveImageFinderResults;
exports.saveTableData = saveTableData;
exports.loadImageFinderResults = loadImageFinderResults;
