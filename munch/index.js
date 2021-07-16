#!/usr/bin/env node --max-old-space-size=4096

const book = require("./book.js");
const utils = require("./utils.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const scene = require("./scene-load.js");
const path = require("path");
const enhance = require("./enhance.js");

const configurator = require("./config.js");

if (process.env.CONFIG_DIR) {
  configurator.setConfigDir(path.resolve(__dirname, process.env.CONFIG_DIR));
}

// For SCENE_DIR and NOTE_DIR set and they are loaded in config.js

async function downloadBooks(config) {
  const availableBooks = await ddb.listBooks(config.cobalt);
  // console.log(availableBooks)
  for (let i = 0; i < availableBooks.length; i++) {
    console.log(`Downloading ${availableBooks[i].book.description}`);
    const options = {
      bookCode: availableBooks[i].bookCode,
    };
    await configurator.getConfig(options);
    console.log(`Download for ${availableBooks[i].book.description} complete`);
  }
}

if (process.argv[2] === "config") {
  const options = {
    externalConfigFile: process.argv[3],
  };
  configurator.getConfig(options).then(() => {
    console.log(`Loaded ${process.argv[3]}`);
    exit();
  });
} else if (process.argv[2] === "list") {
  configurator.getConfig().then((config) => {
    ddb.listBooks(config.cobalt).then((availableBooks) => {
      availableBooks.forEach((book) => {
        console.log(`${book.bookCode} : ${book.book.description}`);
      });
      exit();
    });
  });
} else if (process.argv[2] === "download") {
  configurator.getConfig().then((config) => {
    downloadBooks(config)
      .then(() => {
        console.log("Downloads finished");
        exit();
      });
  });
} else if (process.argv[2] === "load") {
  configurator.getConfig().then((config) => {
    scene.importScene(config, process.argv[3]);
    console.log("Imported scene updates");
    exit();
  });
} else if (process.argv[2] === "scene-ids") {
  configurator.getConfig().then(() => {
    scene.listSceneIds(process.argv[3]);
    exit();
  });
}  else if (process.argv[2] == "enhance") {
  console.log(process.argv[3]);
  const options = {
    bookCode: process.argv[3],
  };
  configurator.getConfig(options).then((config) => {
    enhance.getEnhancedData(config).then(enhanced => {
      console.log(enhanced);
      exit();
    });
    
  });
} else if (process.argv[2] == "meta") {
  configurator.getConfig().then((config) => {
    enhance.getMetaData(config).then(metaData => {
      console.log(`Latest meta data is ${metaData}`);
      console.log(`Current meta data is ${config.metaDataVersion}`);
      exit();
    });
  });
}  else if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a book code or use 'list' to discover codes");
  exit();
} else {
  const options = {
    bookCode: process.argv[2],
  };
  configurator.getConfig(options).then((config) => {
    book.setConfig(config).then(() => {
      book.setMasterFolders();
      utils.directoryReset(config);
      console.log(config.run);
      book.getData();
    });
  });
}
