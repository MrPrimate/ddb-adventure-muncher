const utils = require("./utils.js");
const fs = require("fs");
const path = require("path");

function getTableHints(config) {
  let tableData = [];
  const tableDataFile = path.join(config.run.tableInfoDir, `${config.run.bookCode}.json`);
  const tableDataPath = path.resolve(__dirname, tableDataFile);

  if (fs.existsSync(tableDataPath)){
    tableData = utils.loadJSONFile(tableDataPath);
  }
  return tableData;
}


exports.getTableHints = getTableHints;

