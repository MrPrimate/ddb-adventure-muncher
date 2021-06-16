const utils = require("./utils.js");
const path = require("path");
const { DDB_CONFIG } = require("./ddb-config.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const fs = require("fs");
const _ = require("lodash");

var configDir = "../dbs";
var buildDir = `${configDir}/build`;
var scenesDir = `${configDir}/scene_info`;
var notesDir = `${configDir}/note_info`;
var dbDir;
var CONFIG_FILE = `${configDir}/config.json`;
var LOOKUP_FILE = `${configDir}/lookup.json`;
var config;

const defaultEnhancementEndpoint = "https://proxy.ddb.mrprimate.co.uk";

function setConfigDir (dir) {
  configDir = dir;
  dbDir = `${configDir}/content`;
  buildDir = `${configDir}/build`;
  scenesDir = `${configDir}/scene_info`;
  notesDir = `${configDir}/note_info`;
  CONFIG_FILE = `${configDir}/config.json`;
  LOOKUP_FILE = `${configDir}/lookup.json`;
}

function getLookups() {
  const lookupFile = path.resolve(__dirname,LOOKUP_FILE);
  if (fs.existsSync(lookupFile)){
    return utils.loadJSONFile(lookupFile);
  } else {
    return {};
  }
}

function saveLookups(content) {
  const configFile = path.resolve(__dirname,LOOKUP_FILE);
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

function getMetaData(conf) {
  const metaDataRepoName = (process.env.METADATA_NAME) ? process.env.METADATA_NAME : "ddb-meta-data";
  const metaDataRepoAuthor = (process.env.METADATA_AUTHOR) ? process.env.METADATA_AUTHOR : "MrPrimate";
  const githubApiLatest = `https://api.github.com/repos/${metaDataRepoAuthor}/${metaDataRepoName}/releases/latest`;
  // const githubModuleJson = `https://raw.githubusercontent.com/${metaDataRepoAuthor}/${metaDataRepoName}/master/module.json`;
}

// const options = {
//   bookCode: null,
//   externalConfigFile: null,
//   outputDirPath: null,
// };
async function getConfig(options = {}) {
  let saveConf = false;
  const configFile = path.resolve(__dirname,CONFIG_FILE);
  if (!config) config = utils.loadConfig(configFile);
  if (config.run) delete(config.run);

  if (!fs.existsSync(configDir)){
    fs.mkdirSync(configDir);
  }
  if (!fs.existsSync(buildDir)){
    fs.mkdirSync(buildDir);
  }
  if (!fs.existsSync(scenesDir)){
    fs.mkdirSync(scenesDir);
  }
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

  // cleanup un-needed config
  if (config.key) {
    delete(config.key);
    saveConf = true;
  }
  if (config.patreon) {
    delete(config.patreon);
    saveConf = true;
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

  if (!config.metaDataVersion) {
    config.metaDataVersion = "0.0.0";
    saveConf = true;
  }

  const currentMetaDataVersion = getMetaData(config)
  if (currentMetaDataVersion !== config.metaDataVersion) {
    config.metaDataVersion = currentMetaDataVersion;
    saveConf = true;
  }

  if (saveConf) {
    utils.saveJSONFile(config, configFile);
  }

  if (!options.bookCode) {
    return config;
  }

  // Checking user and authentication
  const userData = await ddb.getUserData(config.cobalt);

  if (userData.status !== "success") {
    console.log(userData);
    console.warn("Unable to determine DDB user");
    exit();
  }

  options.bookCode = options.bookCode.toLowerCase();
  let bookId = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === options.bookCode.toLowerCase()).id;
  if (!bookId) {
    console.log(`Book ${options.bookCode} not found`);
    exit();
  }
  let book = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === options.bookCode).description;
  let outputDirEnv = config.outputDirEnv;
  let dbsDir;
  if (!config.dbsDir) {
    dbsDir = dbDir;
  } else {
    dbsDir = config.dbsDir;
  }

  let downloadDir = path.resolve(__dirname, dbsDir);
  let sourceDir = path.resolve(__dirname, path.join(dbsDir, options.bookCode));
  let outputDir = path.resolve(__dirname, path.join(buildDir, options.bookCode));
  let sceneInfoDir = (process.env.SCENE_DIR) ? process.env.SCENE_DIR : path.resolve(__dirname, path.join(scenesDir, options.bookCode));
  let noteInfoDir = (process.env.NOTE_DIR) ? process.env.NOTE_DIR : path.resolve(__dirname, notesDir);

  config.subDirs = [
    "journal",
    // "compendium",
    "scene",
    "table",
  ];

  console.log(`Pulling ${book} (${options.bookCode}) off the shelf...`);
  console.log(`Saving adventures to ${outputDir}`);

  if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
  }
  const bookZipPath = path.join(downloadDir, `${options.bookCode}.zip`);
  if (!fs.existsSync(bookZipPath)){
    console.log(`Downloading ${book} ... this might take a while...`);
    await ddb.downloadBook(bookId, config.cobalt, bookZipPath);
    console.log("Download finished, beginning book parse!");
  }

  if (!fs.existsSync(sourceDir)){
    console.log(`Having to unzip, targeting ${sourceDir}`);
    await utils.unzipFile(bookZipPath, sourceDir);
  }

  // generate runtime config
  const key = await ddb.getKey(bookId, config.cobalt);
  const enhancementEndpoint = (process.env.ENDPOINT) ? process.env.ENDPOINT : defaultEnhancementEndpoint;  

  config.run = {
    enhancementEndpoint: enhancementEndpoint,
    userData: userData,
    key: key,
    book: book,
    bookId: bookId,
    bookCode: options.bookCode,
    outputDir: outputDir,
    sourceDir: sourceDir,
    sceneInfoDir: sceneInfoDir,
    noteInfoDir: noteInfoDir,
    outputDirEnv: path.resolve(__dirname, outputDirEnv),
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
