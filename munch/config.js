const utils = require("./utils.js");
const path = require("path");
const fs = require("fs");
const logger = require("./logger.js");

var configDir = "../dbs";
var LOOKUP_FILE = `${configDir}/lookup.json`;

// needed by scene loader
function loadImageFinderResults(type, bookCode) {
  const imageScenePath = path.resolve(__dirname,configDir,`${type}-images.json`);

  const data = (fs.existsSync(imageScenePath)) ?
    utils.loadJSONFile(imageScenePath) :
    { bookCode: [] };

  logger.info("loaded image file");

  return data[bookCode];

}

exports.loadImageFinderResults = loadImageFinderResults;

// to add to config
exports.configDir = configDir;
