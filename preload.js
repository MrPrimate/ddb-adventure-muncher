const { shell, contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
    patreon: () => {
      shell.openExternal("http://patreon.com/mrprimate");
    },
    // to backend
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ["loadConfig", "outputDir", "books", "generate", "user"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // to frontend
    receive: (channel, func) => {
      let validChannels = ["config", "books", "generate", "user", "stateMessage", "directoryConfig"];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);

