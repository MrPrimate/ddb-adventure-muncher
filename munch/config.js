const utils = require("./utils.js");
const path = require("path");
const { DDB_CONFIG } = require("./ddb-config.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const fs = require("fs");
const _ = require("lodash");

var configDir = "../dbs";
var buildDir = `${configDir}/build`;
var dbDir;
var CONFIG_FILE = `${configDir}/config.json`;
var LOOKUP_FILE = `${configDir}/lookup.json`;
var config;

const defaultEnhancementEndpoint = "https://ddb.mrprimate.co.uk";


function setConfigDir (dir) {
  configDir = dir;
  dbDir = `${configDir}/content`;
  buildDir = `${configDir}/build`;
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

async function getConfig(bookCode, externalConfigFile, outputDirPath) {
  const configFile = path.resolve(__dirname,CONFIG_FILE);
  if (!config) config = utils.loadConfig(configFile);
  if (config.run) delete(config.run);

  if (!fs.existsSync(configDir)){
    fs.mkdirSync(configDir);
  }
  if (!fs.existsSync(buildDir)){
    fs.mkdirSync(buildDir);
  }

  if (externalConfigFile) {
    const externalConfigPath = path.resolve(__dirname, externalConfigFile);
    if (fs.existsSync(externalConfigPath)){
      console.log(`Getting External Config file ${externalConfigFile}`);
      const externalConfig = utils.loadConfig(externalConfigPath);
      config = _.merge(config, externalConfig);
      utils.saveJSONFile(config, configFile);
    }
  }

  if (outputDirPath) {
    outputDirPath = path.resolve(__dirname,outputDirPath);
    if (fs.existsSync(outputDirPath)){
      config.outputDirEnv = outputDirPath;
      utils.saveJSONFile(config, configFile);
    }
  }

  // cleanup un-needed config
  if (config.key) {
    delete(config.key);
    utils.saveJSONFile(config, configFile);
  }
  if (config.patreon) {
    delete(config.patreon);
    utils.saveJSONFile(config, configFile);
  }

  if (!bookCode) {
    return config;
  }

  // Checking user and authentication
  const userData = await ddb.getUserData(config.cobalt);

  if (userData.status !== "success") {
    console.log(userData);
    console.warn("Unable to determine DDB user");
    exit();
  }

  bookCode = bookCode.toLowerCase();
  let bookId = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === bookCode.toLowerCase()).id;
  if (!bookId) {
    console.log(`Book ${bookCode} not found`);
    exit();
  }
  let book = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === bookCode).description;
  let outputDirEnv = config.outputDirEnv;
  let dbsDir;
  if (!config.dbsDir) {
    dbsDir = dbDir;
  } else {
    dbsDir = config.dbsDir;
  }

  let downloadDir = path.resolve(__dirname, dbsDir);
  let sourceDir = path.resolve(__dirname, path.join(dbsDir, bookCode));
  let outputDir = path.resolve(__dirname, path.join(buildDir, bookCode));
  config.subDirs = [
    "journal",
    // "compendium",
    "scene",
    "table",
  ];

  console.log(`Pulling ${book} (${bookCode}) off the shelf...`);
  console.log(`Saving adventures to ${outputDir}`);

  if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
  }
  const bookZipPath = path.join(downloadDir, `${bookCode}.zip`);
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
    bookCode: bookCode,
    outputDir: outputDir,
    sourceDir: sourceDir,
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
