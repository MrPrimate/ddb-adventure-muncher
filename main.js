const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

require('electron-reload')(__dirname);

const isDevelopment = process.env.NODE_ENV === 'DEV';

let configurator = require("./munch/config.js");
console.log(app.getPath('userData'));
configurator.setConfigDir(app.getPath('userData'));

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

  if (isDevelopment) {
    mainWindow.webContents.openDevTools()
  }

  ipcMain.on("config", (event, args) => {
    // Send result back to renderer process
    // mainWindow.webContents.send("config", {"bears": "not a bear"});
    configurator.getConfig().then(config => {
      console.log("Config loaded");
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
          console.log(config);
          mainWindow.webContents.send('config', config);
        })
      } 
    })
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
};

app.on("ready", loadMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    loadMainWindow();
  }
});



