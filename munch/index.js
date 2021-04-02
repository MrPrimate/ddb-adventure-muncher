const { getConfig } = require("./config.js");
const book = require("./book.js");
const utils = require("./utils.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const scene = require("./scene-load.js");


async function downloadBooks(config) {
  const bookIds = await ddb.listBooks(config.cobalt);
  // console.log(bookIds)
  for (let i = 0; i < bookIds.length; i++) {
    console.log(`Downloading ${bookIds[i].book}`);
    await getConfig(bookIds[i].bookCode, null);
    console.log(`Download for ${bookIds[i].book} complete`);
  }
}

if (process.argv[2] === "config") {
  getConfig(false, process.argv[3]).then((config) => {
    console.log(`Loaded ${process.argv[3]}`);
    exit();
  })
} else if (process.argv[2] === "list") {
  getConfig(false, null).then((config) => {
    ddb.listBooks(config.cobalt).then((bookIds) => {
      bookIds.forEach((book) => {
        console.log(`${book.bookCode} : ${book.book}`);
      })
      exit();
    });
  })
} else if (process.argv[2] === "download") {
  getConfig(false, null).then((config) => {
    downloadBooks(config)
    .then(() => {
      console.log("Downloads finished")
      exit();
    });
  })
} else if (process.argv[2] === "load") {
  getConfig(false, null).then((config) => {
    scene.importScene(config, process.argv[3]);
    console.log("Imported scene updates");
    exit();
  })
} else if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a book code or use 'list' to discover codes");
  exit();
} else {
  getConfig(process.argv[2], null).then((config) => {
    book.setConfig(config);
    book.setMasterFolders();
    utils.directoryReset(config);
    book.getData();
  })
}
