const utils = require("./utils.js");
const path = require("path");
const { DDB_CONFIG } = require("./ddb-config.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const fs = require("fs");
const _ = require('lodash');

var configDir = "../dbs"
var CONFIG_FILE = `${configDir}/config.json`;
var LOOKUP_FILE = `${configDir}/lookup.json`;


function setConfigDir (dir) {
  configDir = dir;
  CONFIG_FILE = `${configDir}/config.json`;
  LOOKUP_FILE = `${configDir}/lookup.json`;
}

function getLookups() {
  const configFile = path.resolve(__dirname,LOOKUP_FILE);
  if (fs.existsSync(configFile)){
    return utils.loadJSONFile(configFile);
  } else {
    return {};
  }
}

function saveLookups(content) {
  const configFile = path.resolve(__dirname,LOOKUP_FILE);
  utils.saveJSONFile(content, configFile);
}

function isConfig() {
  const config = getConfig();
  if (config.cobalt) return true;
  return false;
}

async function getConfig(bookCode, externalConfigFile) {
  const configFile = path.resolve(__dirname,CONFIG_FILE);
  let config = utils.loadConfig(configFile);

  if (!fs.existsSync(configDir)){
    fs.mkdirSync(configDir);
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

  if (!bookCode) {
    return config;
  }

  bookCode = bookCode.toLowerCase();
  var bookId = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === bookCode.toLowerCase()).id;
  if (!bookId) {
    console.log(`Book ${bookCode} not found`);
    exit()
  }
  var book = DDB_CONFIG.sources.find((source) => source.name.toLowerCase() === bookCode).description;
  var outputDirEnv = config.outputDirEnv;
  var dbsDir = config.dbsDir;

  var downloadDir = path.resolve(__dirname, dbsDir);
  var sourceDir = path.resolve(__dirname, path.join(dbsDir, bookCode));
  var outputDir = path.resolve(__dirname, path.join(outputDirEnv, bookCode));
  config.subDirs = [
    "journal",
    // "compendium",
    "scene",
    // "table",
  ];

  console.log(`Pulling ${book} (${bookCode}) off the shelf...`);
  console.log(`Saving adventures to ${outputDir}`);


  //const url = await getBookUrl(bookId, config.cobalt);
  if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
  }
  const bookZipPath = path.join(downloadDir, `${bookCode}.zip`);
  if (!fs.existsSync(bookZipPath)){
    console.log(`Downloading ${book} to ${outputDir} ... this might take a while...`)
    const download = await ddb.downloadBook(bookId, config.cobalt, bookZipPath);
    console.log("Download finished, beginning book parse!");
  }

  if (!fs.existsSync(sourceDir)){
    console.log(`Having to unzip, targeting ${sourceDir}`);
    await utils.unzipFile(bookZipPath, sourceDir);
  }

  // let key = await getKey(bookCode, config.cobalt)
  // console.log(`KEY = ${key}`);
  if (!config.key[bookCode]) {
    config.key[bookCode] = await ddb.getKey(bookId, config.cobalt);
    utils.saveJSONFile(config, configFile);
  }

  config.run = {
    book: book,
    bookCode: bookCode,
    outputDir: outputDir,
    sourceDir: sourceDir,
    outputDirEnv: path.resolve(__dirname, outputDirEnv),
  }
  if (config.debug) {
    console.log("================================");
    console.log("DEBUG CONFIG")
    console.log(config);
    console.log("================================");
  }

  return config;
}

exports.isConfig = isConfig;
exports.getConfig = getConfig;
exports.getLookups = getLookups;
exports.saveLookups = saveLookups;
exports.setConfigDir = setConfigDir;
