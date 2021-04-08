const book = require("./book.js");
const utils = require("./utils.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const scene = require("./scene-load.js");
const path = require("path");
const fs = require("fs");
const enhance = require("./enhance.js");

const configurator = require("./config.js");

if (process.env.CONFIG_DIR) {
  configurator.setConfigDir(path.resolve(__dirname, process.env.CONFIG_DIR));
}

async function downloadBooks(config) {
  const bookIds = await ddb.listBooks(config.cobalt);
  // console.log(bookIds)
  for (let i = 0; i < bookIds.length; i++) {
    console.log(`Downloading ${bookIds[i].book}`);
    await configurator.getConfig(bookIds[i].bookCode, null);
    console.log(`Download for ${bookIds[i].book} complete`);
  }
}

if (process.argv[2] === "config") {
  configurator.getConfig(false, process.argv[3]).then((config) => {
    console.log(`Loaded ${process.argv[3]}`);
    exit();
  })
} else if (process.argv[2] === "list") {
  configurator.getConfig(false, null).then((config) => {
    ddb.listBooks(config.cobalt).then((bookIds) => {
      bookIds.forEach((bookId) => {
        console.log(`${bookId.bookCode} : ${bookId.book}`);
      })
      exit();
    });
  })
} else if (process.argv[2] === "download") {
  configurator.getConfig(false, null).then((config) => {
    downloadBooks(config)
    .then(() => {
      console.log("Downloads finished")
      exit();
    });
  })
} else if (process.argv[2] === "load") {
  configurator.getConfig(false, null).then((config) => {
    scene.importScene(config, process.argv[3]);
    console.log("Imported scene updates");
    exit();
  })
}  else if (process.argv[2] == "enhance") {
  console.log(process.argv[3]);
  configurator.getConfig(process.argv[3], null).then((config) => {
    enhance.getEnhancedData(config).then(enhanced => {
      console.log(enhanced);
      exit();
    })
    
  });
}  else if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a book code or use 'list' to discover codes");
  exit();
} else {
  configurator.getConfig(process.argv[2], null).then((config) => {
    book.setConfig(config).then(() => {
      book.setMasterFolders();
      utils.directoryReset(config);
      console.log(config.run);
      book.getData();
    })
  })
}
