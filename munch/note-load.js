const utils = require("./utils.js");
const fs = require("fs");
const path = require("path");

function getNoteHints(config) {
  let notesData = [];
  const notesDataFile = path.join(config.run.noteInfoDir, `${config.run.bookCode}.json`);
  const notesDataPath = path.resolve(__dirname, notesDataFile);

  if (fs.existsSync(notesDataPath)){
    notesData = utils.loadJSONFile(notesDataPath);
  }
  return notesData;
}


exports.getNoteHints = getNoteHints;

