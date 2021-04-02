const { shell, contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  "api", {
    patreon: () => {
      shell.openExternal("http://patreon.com/mrprimate");
    },
    // configLoaded: (config) => {
    //   ipcRenderer.send('config', config);
    // },
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ["toMain", "config", "loadConfig", "outputDir"];
      if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
        let validChannels = ["fromMain", "config", "loadConfig", "outputDir"];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
  }
);

