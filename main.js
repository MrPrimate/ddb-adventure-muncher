const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const _ = require('lodash');

app.commandLine.appendSwitch('trace-warnings');
app.commandLine.appendSwitch('unhandled-rejections', 'strict');

const isDevelopment = process.env.NODE_ENV === 'DEV';

if (isDevelopment) {
  require('electron-reload')(__dirname);
}

const isMac = process.platform === 'darwin';

const ddb = require("./munch/ddb.js");
const book = require("./munch/book.js");
const utils = require("./munch/utils.js");
const scenes = require("./munch/scene-load.js");
const configurator = require("./munch/config.js");

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const pargs = yargs(hideBin(process.argv));

let allBooks = true;

configurator.setConfigDir(app.getPath('userData'));

const menuTemplate = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'Reset config',
        click: async () => {
          const configFile = path.join(app.getPath('userData'), "config.json");
          console.log(configFile);
          if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
        }
      },
      {
        label: 'Reset generated ids',
        click: async () => {
          const lookupPath = path.join(app.getPath('userData'), "lookup.json");
          console.log(lookupPath);
          if (fs.existsSync(lookupPath)) fs.unlinkSync(lookupPath);
        }
      },
      {
        label: 'Remove downloaded files',
        click: async () => {
          const downloadPath = path.join(app.getPath('userData'), "content");
          console.log(downloadPath);
          if (fs.existsSync(downloadPath)) {
            fs.rmdir(downloadPath, { recursive: true }, (err) => {
              if (err) {
                  throw err;
              }
            });
          }
          const buildPath = path.join(app.getPath('userData'), "build");
          console.log(buildPath);
          if (fs.existsSync(buildPath)) {
            fs.rmdir(buildPath, { recursive: true }, (err) => {
              if (err) {
                  throw err;
              }
            });
          }
        }
      },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Config location',
        click: async () => {
          const configFolder = app.getPath('userData');
          const configFile = path.join(configFolder, "config.json");
          console.log(configFolder);
          if (fs.existsSync(configFile)) {
            shell.showItemInFolder(configFile);  
          } else {
            shell.showItemInFolder(configFolder);
          }
        }
      },
      {
        label: 'Icon attribution',
        click: async () => {
          await shell.openExternal('https://iconarchive.com/show/role-playing-icons-by-chanut/Adventure-Map-icon.html');
        }
      },
      {
        label: 'Software license',
        click: async () => {
          await shell.openExternal('https://opensource.org/licenses/MIT');
        }
      },
      {
        label: 'Source code',
        click: async () => {
          await shell.openExternal('https://github,com/MrPrimate/ddb-adventure-muncher');
        }
      },
      {
        label: `Version: ${app.getVersion()}`
      },
    ]
  }
];

async function downloadBooks(config) {
  const bookIds = await ddb.listBooks(config.cobalt);
  // console.log(bookIds)
  for (let i = 0; i < bookIds.length; i++) {
    process.stdout.write(`Downloading ${bookIds[i].book}`);
    await configurator.getConfig(bookIds[i].bookCode, null);
    process.stdout.write(`Download for ${bookIds[i].book} complete`);
  }
}

function generateAdventure(args) {
  return new Promise((resolve, reject) => {
    configurator.getConfig(args).then(config => {
      if (!isDevelopment) {
        book.setTemplateDir(path.join(process.resourcesPath, "content", "templates"));
        scenes.setSceneDir(path.join(process.resourcesPath, "content", "scene_info"));
      }
      book.setConfig(config).then(() => {
        utils.directoryReset(config);
        book.fetchLookups(config);
        book.setMasterFolders();
        book.getData();
        const targetAdventureZip = path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`);
        const { promisify } = require('util');
        const sleep = promisify(setTimeout);

        const doSomething = async () => {
          while (!fs.existsSync(targetAdventureZip)) {
            console.log(`No adventure at ${targetAdventureZip}`);
            await sleep(1000);
          }
          resolve(true);
        }
        doSomething();
      });
    });
  });
}

function checkAuth() {
  return new Promise((resolve, reject) => {
    configurator.getConfig().then(config => {
      ddb.getUserData(config.cobalt).then((userData) => {
        if (userData.error || !userData.userDisplayName) {
          process.stdout.write("Authentication failure, please check your cobalt token\n");
          process.exit(0);
        }
        else {
          resolve(true);
        }
      });
    });
  });
}

function commandLine() {
  const args = pargs
    .usage('./$0 <command> [options]')
    .option('show-owned-books', {
      alias: 'o',
      describe: "Show only owned books, not shared."
    })
    .command('version', 'Version information')
    .alias('v', "version")
    .command('list', 'List books')
    .alias('l', "list")
    .command('download', 'Download all the book files you have access to. This does not process the book, just downloads for later use.')
    .alias('d', "download")
    .command('generate', 'Generate content for specified book.')
    .alias('g', "generate")
    .nargs('g', 1)
    .command('config', 'Load a config file into the importer.')
    .alias('c', "config")
    .nargs('c', 1)
    .example('$0 generate lmop', 'Generate import file for Lost Mines of Phandelver')
    .help('help')
    .locale('en')
    .argv;

  return new Promise((resolve, reject) => {
    if (args['show-owned-books']){
      process.stdout.write("Owned books mode activated\n");
      allBooks = false;
    }

    if (args.config) {
      configurator.getConfig(false, args.config).then(() => {
        process.stdout.write(`Loaded ${args.config}\n`);
        process.exit(0);
      })
    }

    else if (args.list){
      checkAuth().then(() => {
        configurator.getConfig().then((config) => {
          ddb.listBooks(config.cobalt).then((bookIds) => {
            bookIds.forEach((bookId) => {
              process.stdout.write(`${bookId.bookCode} : ${bookId.book}\n`);
            })
            process.exit(0);
          });
        });
      });
    }

    else if (args.download) {
      checkAuth().then(() => {
        configurator.getConfig().then((config) => {
          downloadBooks(config)
          .then(() => {
            process.stdout.write("Downloads finished\n")
            process.exit(0);
          });
        });
      });
    }

    else if (args.generate) {
      checkAuth().then(() => {
        generateAdventure(args.generate).then(() => {
          process.exit(0);
        });
      })
    }

    else if (args.help){
      process.stdout.write(options.help());
      process.exit(0);
    }
      
    else if (args.version) {
      process.stdout.write(`${app.getVersion()}\n`);
      process.exit(0);
    }
    else {
      resolve(true);
    }
  });

}

const loadMainWindow = () => {

  commandLine();

  let iconLocation = (isDevelopment) ?
    path.join(__dirname, "build", "icon.png") :
    path.join(process.resourcesPath, "content", "icon.png");

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    icon: iconLocation,
    webPreferences: {
      // nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools()
  }

  ipcMain.on("config", (event, args) => {
    // Send result back to renderer process
    // mainWindow.webContents.send("config", {"bears": "not a bear"});
    configurator.getConfig().then(config => {
      mainWindow.webContents.send('config', config);
    })
  });

  ipcMain.on("loadConfig", (event, args) => {
    dialog.showOpenDialog(mainWindow, { 
      properties: ['openFile', 'createDirectory'],
      filters: [
        { name: 'JSON', extensions: ['json'] },
      ],
    }). then(result => {
      if (!result.canceled){
        configurator.getConfig(null, result.filePaths[0]).then(config => {
          mainWindow.webContents.send('config', config);
        })
      } 
    })
  });

  ipcMain.on("outputDir", (event, args) => {
    dialog.showOpenDialog(mainWindow, { 
      properties: ['openDirectory', 'createDirectory'],
    }). then(result => {
      if (!result.canceled){
        configurator.getConfig(null, null, result.filePaths[0]).then(config => {
          mainWindow.webContents.send('config', config);
        })
      } 
    })
  });

  ipcMain.on("books", (event, args) => {
    configurator.getConfig().then(config => {
      ddb.listBooks(config.cobalt, allBooks).then((bookIds) => {
        bookIds = _.orderBy(bookIds, ['book'],['asc']);
        mainWindow.webContents.send('books', bookIds);
      });
    });
  });

  ipcMain.on("user", (event, args) => {
    configurator.getConfig().then(config => {
      ddb.getUserData(config.cobalt).then((userData) => {
        mainWindow.webContents.send('user', userData);
      });
    });
  });

  ipcMain.on("generate", (event, book) => {
    generateAdventure(book).then(() => {
      mainWindow.webContents.send('generate');
    });
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
};

function prepare () {
  commandLine().then(() => {
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



