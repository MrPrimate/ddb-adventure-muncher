#!/usr/bin/env node --max-old-space-size=4096

"use strict";

const path = require("path");
const _ = require("lodash");

const { Config } = require("./adventure/Config.js");
const { Adventure } = require("./adventure/Adventure.js");
const { FileHelper } = require("./adventure/FileHelper.js");

const ddb = require("./data/ddb.js");

let RESULTS = {};


let defaultStatusFile = "./status.json";
const statusFile = (process.env.STATUS_FILE) ? process.env.STATUS_FILE : defaultStatusFile; 
const currentStatusInfo = FileHelper.loadJSONFile(statusFile);

async function parseData(availableBooks) {
  for (let i = 0; i < availableBooks.length; i++) {
    let book = availableBooks[i];
    const bookCode = book.bookCode;

    const configurator = new Config();

    if (process.env.CONFIG_DIR) {
      console.log(`Setting config directory to: ${process.env.CONFIG_DIR}`);
      configurator.setConfigDirs(path.resolve(__dirname, process.env.CONFIG_DIR));
    }

    configurator.loadBook(bookCode).then(() => {
      const adventure = new Adventure(configurator);
      adventure.loadHints().then(() => {
        // console.log(configurator);
        book.scenes = adventure.enhancements.sceneAdjustments.map((scene) => {
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
        const noteData = adventure.enhancements.noteHints;
        book.notes = noteData && noteData.length > 0 ? true : false;
        book.status = currentStatusInfo[bookCode];
    
        RESULTS[book.bookCode] = book;
      });
    });

    RESULTS[book.bookCode] = book;

  }
  console.warn(RESULTS["doip"]);
  FileHelper.saveJSONFile(RESULTS, "./ddb-data.json");
}

function getBooks(bookFile) {
  const availableBooks = FileHelper.loadJSONFile(bookFile);
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
  const config = new Config();

  if (process.env.CONFIG_DIR) {
    console.log(`Setting config directory to: ${process.env.CONFIG_DIR}`);
    config.setConfigDirs(path.resolve(__dirname, process.env.CONFIG_DIR));
  }

  ddb.listBooks(config.data.cobalt).then((availableBooks) => {
    FileHelper.saveJSONFile(availableBooks, "./ddb-books.json");
  });
}
