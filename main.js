const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const _ = require('lodash');

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

const loadMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    icon: path.join(__dirname, "build", "icon.png"),
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
      ddb.listBooks(config.cobalt).then((bookIds) => {
        bookIds = _.orderBy(bookIds, ['book'],['asc']);
        mainWindow.webContents.send('books', bookIds);
      });
    });
  });

  ipcMain.on("generate", (event, args) => {
    configurator.getConfig(args).then(config => {
      if (!isDevelopment) {
        book.setTemplateDir(path.join(process.resourcesPath, "content", "templates"));
        scenes.setSceneDir(path.join(process.resourcesPath, "content", "scene_info"));
      }
      book.setConfig(config);
      book.setMasterFolders();
      utils.directoryReset(config);
      book.getData();
      const targetAdventureZip = path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`);
      const { promisify } = require('util');
      const sleep = promisify(setTimeout);

      const doSomething = async () => {
        while (!fs.existsSync(targetAdventureZip)) {
          console.log(`No adventure at ${targetAdventureZip}`);
          await sleep(100);
        }
        mainWindow.webContents.send('generate');
      }
      doSomething();
    });
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
};

app.on("ready", loadMainWindow);

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



