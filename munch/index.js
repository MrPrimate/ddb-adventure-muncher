const book = require("./book.js");
const utils = require("./utils.js");
const ddb = require("./ddb.js");
const { exit } = require("process");
const scene = require("./scene-load.js");
const path = require("path");
const fs = require("fs");

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
// } else if (process.argv[2] === "all" ) {
//   console.log("GOING ALL IN!");
//   configurator.getConfig(false, null).then((config) => {
//     ddb.listBooks(config.cobalt).then((bookIds) => {
//       console.log("BookIds Found");
//       bookIds.forEach((bookId) => {
//         console.log(`${bookId.bookCode} : ${bookId.book}`);
//         configurator.getConfig(bookId.bookCode).then((cfg) => {
//           book.setConfig(cfg);
//           book.setMasterFolders();
//           utils.directoryReset(cfg);
//           book.getData();
//           const targetAdventureZip = path.join(cfg.run.outputDirEnv,`${cfg.run.bookCode}.fvttadv`);
//           const { promisify } = require('util');
//           const sleep = promisify(setTimeout);

//           const doSomething = async () => {
//             while (!fs.existsSync(targetAdventureZip)) {
//               console.log(`Waiting for adventure at ${targetAdventureZip}`);
//               await sleep(1000);
//             }
//           }
//           doSomething();
//         });
//       });
//     });
//   })
}  else if (!process.argv[2] || process.argv[2] == "" ) {
  console.log("Please enter a book code or use 'list' to discover codes");
  exit();
} else {
  configurator.getConfig(process.argv[2], null).then((config) => {
    book.setConfig(config);
    book.setMasterFolders();
    utils.directoryReset(config);
    console.log(config.run);
    book.getData();
  })
}
