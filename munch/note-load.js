const utils = require("./utils.js");
const fs = require("fs");
const path = require("path");

var notesDir = path.join("..", "content", "note_info");

function setNotesDir (dir) {
  notesDir = dir;
}

function getNoteHints(bookCode) {
  let notesData = [];
  const notesDataFile = path.join(notesDir, `${bookCode}.json`);
  const notesDataPath = path.resolve(__dirname, notesDataFile);

  if (fs.existsSync(notesDataPath)){
    notesData = utils.loadJSONFile(notesDataPath);
  }
  return notesData;
}


exports.getNoteHints = getNoteHints;
exports.setNotesDir = setNotesDir;

