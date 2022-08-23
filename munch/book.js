"use strict";

const utils = require("./utils.js");
const { getAllSQL } = require("./data/sql.js");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { exit } = require("process");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("better-sqlite3-multiple-ciphers");
const _ = require("lodash");
const configure = require("./config.js");
const sceneAdjuster = require("./scene-load.js");
const noteHinter = require("./note-load.js");
const tableHinter = require("./table-load.js");
const enhance = require("./enhance.js");
const replacer = require("./replacer.js");
const icons = require("./icons.js");
const logger = require("./logger.js");
const Ids = require("./adventure/IdFactory.js");
const Assets = require("./adventure/Assets.js");

const JOURNAL_SORT = 1000;

var config;
var idTable;
var sceneAdjustments;
var noteHints;
var tableHints;
var sceneImgMatched = [];
var journalImgMatched = [];
var enhancedScenes = [];
var downloadList = [];
var tableMatched = [];

let replaceLinks = [];
let tempHandouts = {};

var masterFolder;

let documents = [];
let generatedJournals = [];
let generatedFolders = [];
let generatedScenes = [];
let generatedTables = [];



function generateJournalChapterEntry(row, img=null) {
  const existingJournal = generatedJournals.find((f) => f.flags.ddb.ddbId == row.id);
  if (!existingJournal){
    if (!row.title || row.title == "") {
      const frag = new JSDOM(row.html);
      row.title = frag.window.document.body.textContent;
    }
    logger.info(`Generating ${row.title}`);
    const journal = generateJournalEntry(row, img);
    return journal;
  }
  return undefined;
}

function outputAdventure(config) {
  if (!fs.existsSync(config.run.outputDir)) {
    fs.mkdirSync(config.run.outputDir);
  }

  config.subDirs.forEach((d) => {
    if (!fs.existsSync(path.join(config.run.outputDir,d))) {
      fs.mkdirSync(path.join(config.run.outputDir,d));
    }
  });

  logger.info("Exporting adventure outline...");

  const adventure = require(path.join(templateDir,"adventure.json"));
  adventure.name = config.run.book.description;
  adventure.id = utils.randomString(10, "#aA");
  adventure.required = config.run.required;

  const adventureData = JSON.stringify(adventure);
  fs.writeFileSync(path.join(config.run.outputDir,"adventure.json"), adventureData);
}

function outputJournals(parsedChapters, config) {
  logger.info("Exporting journal chapters...");

  // journals out
  parsedChapters.forEach((chapter) => {
    const journalEntry = JSON.stringify(chapter);
    fs.writeFileSync(path.join(config.run.outputDir,"journal",`${chapter._id}.json`), journalEntry);
  });
}

function outputScenes(parsedScenes, config) {
  logger.info("Exporting scenes...");

  // scenes out
  parsedScenes.forEach((scene) => {
    const sceneContent = JSON.stringify(scene);
    fs.writeFileSync(path.join(config.run.outputDir,"scene",`${scene._id}.json`), sceneContent);
  });
}


function outputTables(parsedTables, config) {
  logger.info("Exporting tables...");

  // tables out
  parsedTables.forEach((table) => {
    const tableContent = JSON.stringify(table);
    fs.writeFileSync(path.join(config.run.outputDir,"table",`${table._id}.json`), tableContent);
  });
}

function hasFolderContent(parsedFolders, foldersWithContent, folder) {
  const hasContent = foldersWithContent.includes(folder._id);
  if (hasContent) return true;

  const childFolders = parsedFolders.filter((pFolder) => folder._id === pFolder.parent);
  if (!childFolders) return false;

  const hasChildrenWithContent = childFolders.some((childFolder) => foldersWithContent.includes(childFolder._id));
  if (hasChildrenWithContent) return true;

  const hasRecursiveContent = childFolders.some((childFolder) => hasFolderContent(parsedFolders, foldersWithContent, childFolder));

  return hasRecursiveContent;

}

function outputFolders(parsedFolders, config, content) {
  logger.info("Exporting required folders...");

  const foldersWithContent = parsedFolders.filter((folder) => content.some((content) =>
    folder._id === content.folder ||
    masterFolder[folder.type]._id == folder._id
  )).map((folder) => folder._id);

  const finalFolders = parsedFolders.filter((folder) => hasFolderContent(parsedFolders, foldersWithContent, folder));

  const foldersData = JSON.stringify(finalFolders);
  fs.writeFileSync(path.join(config.run.outputDir,"folders.json"), foldersData);
}



async function setConfig(conf) {
  config = conf;
  logger.info(`Adventure Muncher version ${config.run.version}`);
  logger.info(`Starting import of ${config.run.bookCode}`);
  masterFolder = undefined;
  documents = [];
  generatedJournals = [];
  generatedFolders = [];
  generatedScenes = [];
  generatedTables = [];
  imageFinderSceneResults = [];
  imageFinderJournalResults = [];
  sceneImgMatched = [];
  journalImgMatched = [];
  tableMatched = [];
  replaceLinks = [];
  tempHandouts = {};
  fetchLookups(config);
  sceneAdjustments = sceneAdjuster.getSceneAdjustments(config, true);
  noteHints = noteHinter.getNoteHints(config);
  tableHints = tableHinter.getTableHints(config);
  enhancedScenes = await enhance.getEnhancedData(config);
  downloadList = [];
  logger.debug("Current config adjustments", {
    sceneAdjustments: sceneAdjustments.length,
    noteHints: noteHints.length,
    tableHints: tableHints.length,
    enhancedScenes: enhancedScenes.length,
  });
}



exports.setMasterFolders = setMasterFolders;
exports.setTemplateDir = setTemplateDir;
exports.getData = getData;
exports.setConfig = setConfig;
exports.fetchLookups = fetchLookups;
