#!/usr/bin/env node --max-old-space-size=4096

const { Adventure } = require("./adventure/Adventure.js");
const { Config } = require("./adventure/Config.js");
const { FileHelper } = require("./adventure/FileHelper.js");
const scene = require("./scene-load.js");
const ddb = require("./data/ddb.js");
const enhance = require("./data/enhance.js");

const { exit } = require("process");
const path = require("path");

const logger = require("./logger.js");


// immediately clear the log file
logger.clear();

const configurator = new Config();

if (process.env.CONFIG_DIR) {
  configurator.setConfigDirs(path.resolve(__dirname, process.env.CONFIG_DIR));
}

// For SCENE_DIR and NOTE_DIR set and they are loaded in config.js

async function downloadBooks() {
  const availableBooks = await ddb.listBooks(configurator.cobalt);
  // console.log(availableBooks)
  for (let i = 0; i < availableBooks.length; i++) {
    console.log(`Downloading ${availableBooks[i].book.description}`);
    await configurator.loadBook(availableBooks[i].bookCode);
    console.log(`Download for ${availableBooks[i].book.description} complete`);
  }
}

if (process.argv[2] === "config") {
  const options = {
    externalConfigFile: process.argv[3],
  };
  new Config(options);
  console.log(`Loaded ${process.argv[3]}`);
  exit();
} else if (process.argv[2] === "list") {
  ddb.listBooks(configurator.cobalt).then((availableBooks) => {
    availableBooks.forEach((book) => {
      console.log(`${book.bookCode} : ${book.book.description}`);
    });
    exit();
  });
} else if (process.argv[2] === "download") {
  downloadBooks()
    .then(() => {
      console.log("Downloads finished");
      exit();
    });
} else if (process.argv[2] === "load") {
  scene.importScene(configurator, process.argv[3]);
  console.log("Imported scene updates");
  exit();
} else if (process.argv[2] === "scene-check") {
  scene.sceneCheck(configurator, process.argv[3]);
  exit();
} else if (process.argv[2] === "scene-ids") {
  scene.listSceneIds(process.argv[3]);
  exit();
}  else if (process.argv[2] == "enhance") {
  console.log(process.argv[3]);
  configurator.loadBook(process.argv[3]).then(() => {
    enhance.getEnhancedData(configurator).then(enhanced => {
      console.log(enhanced);
      exit();
    });
  });
} else if (process.argv[2] == "meta") {
  enhance.getMetaData(configurator).then(metaData => {
    console.log(`Latest meta data is ${metaData}`);
    console.log(`Current meta data is ${configurator.metaDataVersion}`);
    exit();
  });
}  else if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a book code or use 'list' to discover codes");
  exit();
} else {
  configurator.loadBook(process.argv[2]).then(() => {
    const adventure = new Adventure(configurator);
    adventure.
    book.setConfig(config).then(() => {
      book.setMasterFolders();
      FileHelper.directoryReset(config);
      console.log(config.run);
      book.getData();
    });
  });
}
