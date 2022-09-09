const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const logger = require("./munch/logger.js");
// immediately clear the log file
logger.clear();

// Load environment variables
const isDevelopment = process.env.NODE_ENV === "DEV";
const memoryCap = process.env.MEMORY ? process.env.MEMORY : "6144";

// add electron switches
app.commandLine.appendSwitch("trace-warnings");
app.commandLine.appendSwitch("unhandled-rejections", "strict");
app.commandLine.appendSwitch("js-flags", `--max-old-space-size=${memoryCap} --expose-gc`);

// Keep a global reference of the window object
let mainWindow;

if (isDevelopment) {
  require("electron-reload")(__dirname);
}

const isMac = process.platform === "darwin";

const ddb = require("./munch/data/ddb.js");
const { Adventure } = require("./munch/adventure/Adventure.js");
const { Config } = require("./munch/adventure/Config.js");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const pargs = yargs(hideBin(process.argv));

const { autoUpdater } = require("electron-updater");

let allBooks = true;

const configDir = app.getPath("userData");

const menuTemplate = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideothers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
    ]
    : []),
  // { role: 'fileMenu' }
  {
    label: "File",
    submenu: [
      {
        label: "Reset config",
        click: async () => {
          const configFile = path.join(configDir, "config.json");
          logger.info(configFile);
          if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
        },
      },
      {
        label: "Reset generated ids",
        click: async () => {
          const lookupPathV3 = path.join(configDir, "lookup.json");
          logger.info(lookupPathV3);
          if (fs.existsSync(lookupPathV3)) fs.unlinkSync(lookupPathV3);
          const lookupPathV4 = path.join(configDir, "lookup4.json");
          logger.info(lookupPathV4);
          if (fs.existsSync(lookupPathV4)) fs.unlinkSync(lookupPathV4);
        },
      },
      {
        label: "Remove downloaded files",
        click: async () => {
          const downloadPath = path.join(configDir, "content");
          logger.info(downloadPath);
          if (fs.existsSync(downloadPath)) {
            fs.rm(downloadPath, { recursive: true }, (err) => {
              if (err) {
                throw err;
              }
            });
          }
          const buildPath = path.join(configDir, "build");
          logger.info(buildPath);
          if (fs.existsSync(buildPath)) {
            fs.rm(buildPath, { recursive: true }, (err) => {
              if (err) {
                throw err;
              }
            });
          }
          const metaPath = path.join(configDir, "meta");
          logger.info(metaPath);
          if (fs.existsSync(metaPath)) {
            fs.rm(metaPath, { recursive: true }, (err) => {
              if (err) {
                throw err;
              }
            });
          }
        },
      },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  },
  // { role: 'viewMenu' }
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" },
        ]
        : [{ role: "close" }]),
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Config location",
        click: async () => {
          const configFile = path.join(configDir, "config.json");
          logger.info(configDir);
          if (fs.existsSync(configFile)) {
            shell.showItemInFolder(configFile);
          } else {
            shell.showItemInFolder(configDir);
          }
        },
      },
      {
        label: "Log file location",
        click: async () => {
          const logFolder = path.join(configDir, "logs");
          const logFile = path.join(logFolder, "main.log");
          logger.info(logFolder);
          if (fs.existsSync(logFile)) {
            shell.showItemInFolder(logFile);
          } else {
            shell.showItemInFolder(logFolder);
          }
        },
      },
      {
        label: "Scene status page",
        click: async () => {
          await shell.openExternal(
            "https://docs.ddb.mrprimate.co.uk/status.html"
          );
        },
      },
      {
        label: "Icon attribution",
        click: async () => {
          await shell.openExternal(
            "https://iconarchive.com/show/role-playing-icons-by-chanut/Adventure-Map-icon.html"
          );
        },
      },
      {
        label: "Software license",
        click: async () => {
          await shell.openExternal("https://opensource.org/licenses/MIT");
        },
      },
      {
        label: "Source code",
        click: async () => {
          await shell.openExternal(
            "https://github.com/MrPrimate/ddb-adventure-muncher"
          );
        },
      },
      {
        label: `Version: ${app.getVersion()}`,
      },
    ],
  },
];

async function downloadBooks(config) {
  const availableBooks = await ddb.listBooks(config.data.cobalt);
  // logger.info(bookIds)
  for (let i = 0; i < availableBooks.length; i++) {
    process.stdout.write(`Downloading ${availableBooks[i].book.description}`);
    await config.loadBook(availableBooks[i].bookCode);
    process.stdout.write(`Download for ${availableBooks[i].book.description} complete`);
  }
}

async function generateAdventure(options, returnFuncs) {
  options.version = app.getVersion();
  options.returns = returnFuncs;
  options.configDir = configDir;
  // return new Promise((resolve) => {
  const config = new Config(options);
  await config.loadBook(options.bookCode);

  const overrides = isDevelopment
    ? {}
    : {
      templateDir: path.join(process.resourcesPath, "content", "templates")
    };

  const adventure = new Adventure(config, overrides);
  adventure.processAdventure();
}

function checkAuth() {
  return new Promise((resolve) => {
    const config = new Config({configDir});
    ddb.getUserData(config.data.cobalt).then((userData) => {
      if (userData.error || !userData.userDisplayName) {
        process.stdout.write("Authentication failure, please check your cobalt token\n");
        process.exit(0);
      } else {
        resolve(config);
      }
    });
  });
}

function commandLine() {
  const args = pargs
    .usage("./$0 <command> [options]")
    .option("show-owned-books", {
      alias: "o",
      describe: "Show only owned books, not shared.",
    })
    .command("version", "Version information")
    .alias("v", "version")
    .command("list", "List books")
    .alias("l", "list")
    .command(
      "download",
      "Download all the book files you have access to. This does not process the book, just downloads for later use."
    )
    .alias("d", "download")
    .command("generate", "Generate content for specified book.")
    .alias("g", "generate")
    .nargs("g", 1)
    .command("config", "Load a config file into the importer.")
    .alias("c", "config")
    .nargs("c", 1)
    .example(
      "$0 generate lmop",
      "Generate import file for Lost Mines of Phandelver"
    )
    .help("help")
    .locale("en").argv;

  return new Promise((resolve) => {
    if (args["show-owned-books"]) {
      process.stdout.write("Owned books mode activated\n");
      allBooks = false;
    }

    if (args.config) {
      const options = {
        externalConfigFile: args.config,
        configDir,
      };
      new Config(options);
      process.stdout.write(`Loaded ${args.config}\n`);
      process.exit(0);
    } else if (args.list) {
      checkAuth().then((config) => {
        ddb.listBooks(config.data.cobalt).then((books) => {
          books.forEach((book) => {
            process.stdout.write(`${book.bookCode} : ${book.book.description}\n`);
          });
          process.exit(0);
        });
      });
    } else if (args.download) {
      checkAuth().then((config) => {
        downloadBooks(config).then(() => {
          process.stdout.write("Downloads finished\n");
          process.exit(0);
        });
      });
    } else if (args.generate) {
      checkAuth().then(() => {
        generateAdventure(args.generate);
      });
    } else if (args.help) {
      // eslint-disable-next-line no-undef
      process.stdout.write(options.help());
      process.exit(0);
    } else if (args.version) {
      process.stdout.write(`${app.getVersion()}\n`);
      process.exit(0);
    } else {
      resolve(true);
    }
  });
}

function loadMainWindow() {
  commandLine();

  let iconLocation = isDevelopment
    ? path.join(__dirname, "build", "icon.png")
    : path.join(process.resourcesPath, "content", "icon.png");

  mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: iconLocation,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once("ready-to-show", () => {
    const config = new Config({configDir});
    mainWindow.webContents.send("config", config);
  });
  

  // eslint-disable-next-line no-unused-vars
  ipcMain.on("config", (event, args) => {
    // Send result back to renderer process
    // mainWindow.webContents.send("config", {"bears": "not a bear"});
    const config = new Config({configDir});
    mainWindow.webContents.send("config", config);
  });

  // eslint-disable-next-line no-unused-vars
  ipcMain.on("loadConfig", (event, args) => {
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile", "createDirectory"],
        filters: [{ name: "JSON", extensions: ["json"] }],
      })
      .then((result) => {
        if (!result.canceled) {
          const options = {
            externalConfigFile: result.filePaths[0],
            configDir,
          };
          console.debug("Loading config", options);
          const config = new Config(options);
          mainWindow.webContents.send("config", config);
        }
      });
  });

  // eslint-disable-next-line no-unused-vars
  ipcMain.on("outputDir", (event, args) => {
    dialog
      .showOpenDialog(mainWindow, {
        properties: ["openDirectory", "createDirectory"],
      })
      .then((result) => {
        if (!result.canceled) {
          // options.bookCode, options.externalConfigFile, options.outputDirPath
          const options = {
            outputDirPath: result.filePaths[0],
            configDir,
          };
          const config = new Config(options);
          mainWindow.webContents.send("config", config);
        }
      });
  });

  // eslint-disable-next-line no-unused-vars
  ipcMain.on("books", (event, config) => {
    ddb.listBooks(config.data.cobalt, allBooks).then((books) => {
      books = _.orderBy(books, ["book.description"], ["asc"]);
      mainWindow.webContents.send("books", books);
    });
  });

  // eslint-disable-next-line no-unused-vars
  ipcMain.on("user", (event, config) => {
    ddb.getUserData(config.data.cobalt).then((userData) => {
      mainWindow.webContents.send("user", userData);
    });
  });

  const returnAdventure = (adventure) => {
    const data = {
      success: true,
      message: `Successfully generated ${adventure.bookCode}.fvttadv`,
      data: [],
      ddbVersions: adventure.config.ddbVersions,
    };
    const targetAdventureZip = path.join(
      adventure.config.outputDirEnv,
      `${adventure.bookCode}.fvttadv`
    );
    logger.info(`Adventure generated to ${targetAdventureZip}`);
    try {
      mainWindow.webContents.send("generate", data);
    } catch (err) {
      logger.error(err);
      logger.error(err.stack);
    }
  };

  const statusMessage = (message) => {
    try {
      console.warn(message);
      mainWindow.webContents.send("stateMessage", message);
    } catch (err) {
      logger.error(err);
      logger.error(err.stack);
    }
  };

  ipcMain.on("generate", (event, data) => {
    const returnFuncs = {
      returnAdventure: returnAdventure,
      statusMessage: statusMessage,
    };
    generateAdventure(data, returnFuncs);
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function prepare() {
  commandLine().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
    loadMainWindow();
  });
}

app.on("ready", prepare);

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    loadMainWindow();
  }
});
