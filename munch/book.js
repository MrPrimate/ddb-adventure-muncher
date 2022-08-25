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
