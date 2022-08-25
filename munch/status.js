#!/usr/bin/env node --max-old-space-size=4096

"use strict";

const utils = require("./utils.js");
const ddb = require("./ddb.js");
const scene = require("./scene-load.js");
const path = require("path");
const notes = require("./note-load.js");
const configurator = require("./config.js");
const _ = require("lodash");

if (process.env.CONFIG_DIR) {
  configurator.setConfigDirs(path.resolve(__dirname, process.env.CONFIG_DIR));
}

let RESULTS = {};

const defaultEnhancementEndpoint = "https://proxy.ddb.mrprimate.co.uk";
var configDir = process.env.CONFIG_DIR;

let CONFIG_FILE = `${configDir}/config.json`;
let metaDir = `${configDir}/meta`;
let scenesDir = path.resolve(__dirname, path.join(metaDir, "scene_info"));
let notesDir = path.resolve(__dirname, path.join(metaDir, "note_info"));
let assetsDir = path.resolve(__dirname, path.join(metaDir, "assets"));
let tablesDir = path.resolve(__dirname, path.join(metaDir, "table_info"));
const noteInfoDir = (process.env.NOTE_DIR) ? process.env.NOTE_DIR : path.resolve(__dirname, notesDir);
const sceneInfoDir = (process.env.SCENE_DIR) ? process.env.SCENE_DIR : path.resolve(__dirname, scenesDir);
const assetsInfoDir = (process.env.ASSETS_DIR) ? process.env.ASSETS_DIR : path.resolve(__dirname, assetsDir);
const tableInfoDir = (process.env.TABLE_DIR) ? process.env.TABLE_DIR : path.resolve(__dirname, tablesDir);
const enhancementEndpoint = (process.env.ENDPOINT) ? process.env.ENDPOINT : defaultEnhancementEndpoint; 

let defaultStatusFile = "./status.json";
const statusFile = (process.env.STATUS_FILE) ? process.env.STATUS_FILE : defaultStatusFile; 
const currentStatusInfo = utils.loadJSONFile(statusFile);

async function parseData(availableBooks) {
  for (let i = 0; i < availableBooks.length; i++) {
    let book = availableBooks[i];
    const bookCode = book.bookCode;
    const configFile = path.resolve(__dirname, CONFIG_FILE);
    let config = utils.loadConfig(configFile);
    config.run = {
      book,
      bookCode,
      sceneInfoDir,
      noteInfoDir,
      assetsInfoDir,
      tableInfoDir,
      enhancementEndpoint,
    };
    // await bookGen.setConfig(config);

    const sceneData = scene.getSceneAdjustments(config);
    book.scenes = sceneData.map((scene) => {
      const result = {
        name: scene.name,
        navName: scene.navName,
        lights: scene.lights.length,
        walls: scene.walls.length,
        ddbId: scene.flags.ddb.ddbId,
        cobaltId: scene.flags.ddb.cobaltId,
        parentId: scene.flags.ddb.parentId,
        versions: scene.flags.ddb.versions,
        foundryVersion: scene.flags.ddb.foundryVersion ? scene.flags.ddb.foundryVersion : "0.8.9",
        notes: scene.flags.ddb.notes ? scene.flags.ddb.notes.length : 0,
        tokens: scene.flags.ddb.tokens ? scene.flags.ddb.tokens.length : 0,
        tiles: scene.flags.ddb?.tiles ? scene.flags.ddb.tiles.length : 0,
        stairways: scene.flags.stairways && Array.isArray(scene.flags.stairways) ? scene.flags.stairways.length : 0,
        perfectVision: scene.flags["perfect-vision"] && !Array.isArray(scene.flags["perfect-vision"]) ? true : false,
      };
      return result;
    });
    const noteData = notes.getNoteHints(config);
    book.notes = noteData && noteData.length > 0 ? true : false;
    book.status = currentStatusInfo[bookCode];

    RESULTS[book.bookCode] = book;

  }
  console.warn(RESULTS["doip"]);
  utils.saveJSONFile(RESULTS, "./ddb-data.json");
}

function getBooks(bookFile) {
  const availableBooks = utils.loadJSONFile(bookFile);
  const orderedBooks = _.orderBy(availableBooks, ["book.description"], ["asc"]);
  return orderedBooks;
}

// generates ddb-data.json
if (process.argv[2] === "generate-data") {
  const booksData = getBooks("./ddb-books.json");
  parseData(booksData);
}

// generates ddb-books.json
if (process.argv[2] === "generate-config") {
  configurator.getConfig().then((config) => {
    ddb.listBooks(config.cobalt).then((availableBooks) => {
      utils.saveJSONFile(availableBooks, "./ddb-books.json");
    });
  });
}
