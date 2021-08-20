const utils = require("./utils.js");
const path = require("path");
const ddb = require("./ddb.js");
const enhance = require("./enhance.js");
const { exit } = require("process");
const fs = require("fs");
const _ = require("lodash");

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

  console.log("loaded image file");

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
      console.log(`Getting External Config file ${options.externalConfigFile}`);
      const externalConfig = utils.loadConfig(externalConfigPath);
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
    console.log(`DownloadDir ${downloadDir}`); 
    console.log(`MetaInfoDir ${metaInfoDir}`); 
    console.log(`SceneInfoDir ${sceneInfoDir}`);
    console.log(`NoteInfoDir ${noteInfoDir}`);
    console.log(`TableInfoDir ${tableInfoDir}`);
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
    console.log(userData);
    console.warn("Unable to determine DDB user");
    exit();
  }

  options.bookCode = options.bookCode.toLowerCase();
  config.run.ddb_config = await ddb.getDDBConfig();
  const book = config.run.ddb_config.sources.find((source) => source.name.toLowerCase() === options.bookCode.toLowerCase());
  if (!book.id) {
    console.log(`Book ${options.bookCode} not found`);
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

  console.log(`Saving adventures to ${outputDir}`);

  console.log(`Pulling ${book.description} (${options.bookCode}) off the shelf...`);

  const versionsFile = path.resolve(__dirname, path.join(metaInfoDir, "versions.json"));
  console.log(`Supported versions file ${versionsFile}`);
  let currentVersion = 0;
  let supportedVersion = 0;
  let updateAvailable = false;
  let downloadNewVersion = false;
  let versions = {};
  versions[options.bookCode] = currentVersion;

  if (fs.existsSync(sourceDir)) {
    console.warn("LOADING CURRENT VERSION");
    const downloadedVersionPath = path.resolve(__dirname, path.join(sourceDir, "version.txt"));
    const existingVersionContent = utils.loadFile(downloadedVersionPath);
    currentVersion = parseInt(existingVersionContent.trim());
    const latest = await ddb.checkLatestBookVersion(book.id, config.cobalt, currentVersion);
    console.warn(latest);
    if (latest.sourceUpdatesAvailable[book.id]) {
      updateAvailable = true;
    }
  }

  if (fs.existsSync(versionsFile)){
    console.warn("LOADING VERSIONS");
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
    console.log(`Downloading ${book.description} ... this might take a while...`);
    await ddb.downloadBook(book.id, config.cobalt, bookZipPath);
    console.log("Download finished, beginning book parse!");
  }

  if (!fs.existsSync(sourceDir)){
    console.log(`Having to unzip, targeting ${sourceDir}`);
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
    console.warn("SAVING VERSIONS");
    versions[options.bookCode] = currentVersion;
    utils.saveConfig(versions, versionsFile);
  }

  console.log(`Current version: ${currentVersion}`);
  console.log(`Supported version: ${supportedVersion}`);
  console.log(`Downloaded new: ${downloadNewVersion}`);

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
    console.log("================================");
    console.log("DEBUG CONFIG");
    console.log(config);
    console.log("CONFIG RUNTIME");
    console.log(config.run);
    console.log("================================");
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
