const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const extract = require("extract-zip");
const fse = require("fs-extra");
const fetch = require("node-fetch");
const logger = require("../logger.js");

class FileHelper {
  static checkDirectories(directories) {
    directories.forEach((dir) => {
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  static getFilePathsRecursively(dir) {
    // returns a flat array of absolute paths of all files recursively contained in the dir
    let results = [];
    let list = fs.readdirSync(dir);

    var pending = list.length;
    if (!pending) return results;

    for (let file of list) {
      file = path.resolve(dir, file);

      let stat = fs.lstatSync(file);

      if (stat && stat.isDirectory()) {
        results = results.concat(FileHelper.getFilePathsRecursively(file));
      } else {
        results.push(file);
      }

      if (!--pending) return results;
    }

    return results;
  }

  static getZipOfFolder(dir) {
    // returns a JSZip instance filled with contents of dir.

    const allPaths = FileHelper.getFilePathsRecursively(path.resolve(dir));

    logger.debug(`Compressing ${allPaths.length} items into the adventure file...`);

    let zip = new JSZip();
    for (const filePath of allPaths) {
      const addPath = path.relative(dir, filePath);
      const data = fs.readFileSync(filePath);
      const stat = fs.lstatSync(filePath);
      const binary = filePath.endsWith(".json") ? false : true;
      const name = addPath.split(path.sep).join(path.posix.sep);
      const options = {
        dir: stat.isDirectory(),
        binary,
        createFolders: true,
      };

      logger.debug(`Adding ${name} (Binary? ${options.binary}) (Dir? ${options.dir})`);
      zip.file(name, data, options);
    }

    return zip;
  }

  static async writeZipFile(zip, targetFile) {
    return new Promise((resolve) => {
      zip
        .generateNodeStream({ type: "nodebuffer", streamFiles: true })
        .pipe(fs.createWriteStream(targetFile))
        .on("finish", function () {
          // JSZip generates a readable stream with a "end" event,
          // but is piped here in a writable stream which emits a "finish" event.
          logger.info(`${targetFile} written.`);
          resolve(targetFile);
        });
    });
  }

  static async unzipFile(filePath, destination) {
    try {
      await extract(filePath, { dir: destination });
      logger.info("Extraction complete");
      return filePath;
    } catch (err) {
      logger.error("Error extracting file", err);
      throw new Error("Error extracting file", err);
      // handle any errors
    }
  }

  static fetchWithTimeout(url, options, timeout = 15000) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      ),
    ]);
  }

  static fetchFile(url, destination, timeout = 15000) {
    logger.info(`Downloading ${url} to ${destination} (timeout: ${timeout})`);
    const options = {
      url: url,
      encoding: null,
    };

    return new Promise((resolve, reject) => {
      FileHelper.fetchWithTimeout(url, options, timeout)
        .then((res) => {
          const dest = fs.createWriteStream(destination);
          res.body.pipe(dest);
          dest.on("finish", function () {
            dest.close();
            resolve(destination);
          });
          dest.on("error", reject);
        })
        .catch((error) => {
          logger.error("error", error);
          reject(error);
        });
    });
  }

  static downloadFile(
    url,
    destination,
    timeout = 1500,
    count = 0,
    maxcount = 5,
    error = null
  ) {
    return new Promise((resolve, reject) => {
      if (count === maxcount) {
        logger.error("Max attempts reached. Download error:", error);
        fs.rmSync(destination);
        reject(error);
      } else {
        try {
          FileHelper.fetchFile(url, destination, timeout).then((destination) => {
            resolve(destination);
          });
        } catch (err) {
          logger.error(
            `Failed to download ${url} to ${destination} (Attempt ${
              count + 1
            } of ${maxcount})`
          );
          fs.rmSync(destination);
          resolve(
            FileHelper.downloadFile(url, destination, timeout, count + 1, maxcount, err)
          );
        }
      }
    });
  }

  static loadFile(file) {
    const filePath = path.resolve(__dirname, file);
    // console.warn(filePath)
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath);
        return content.toString();
      } catch (err) {
        logger.error(err);
      }
    } else {
      return undefined;
    }
  }

  static loadJSONFile(file) {
    const configPath = path.resolve(__dirname, file);
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(JSON.stringify(require(configPath)));
      return config;
    } else {
      return {};
    }
  }

  static loadConfig(file) {
    const config = FileHelper.loadJSONFile(file);

    if (process.env.output) {
      config.output = process.env.output;
    }

    return config;
  }

  /**
   * Save object to JSON in a file
   * @param {*} content
   * @param {*} file
   */
  static saveJSONFile(content, filePath) {
    try {
      const data = JSON.stringify(content, null, 4);
      fs.writeFileSync(filePath, data);
      logger.info(`JSON file saved to ${filePath}`);
      // logger.silly(`JSON file saved to ${filePath}`, content);
    } catch (error) {
      logger.error(error);
    }
  }

  /**
   * Save text in a file
   * @param {*} content
   * @param {*} file
   */
  static saveFile(content, filePath) {
    try {
      fs.writeFileSync(filePath, content);
      logger.info(`File saved to ${filePath}`);
    } catch (error) {
      logger.error(error);
    }
  }

  static directoryReset(config) {
    logger.info(`Resetting output dir ${config.outputDir}`);
    // delete directory recursively
    config.data.subDirs.forEach((d) => {
      if (fs.existsSync(path.join(config.outputDir, d))) {
        fs.rmSync(
          path.join(config.outputDir, d),
          { recursive: true }
        );
      }
    });
    // delete adventure zip
    const targetAdventureZip = path.join(
      config.outputDirEnv,
      `${config.bookCode}.fvttadv`
    );
    if (fs.existsSync(targetAdventureZip)) {
      logger.info(`Removing ${targetAdventureZip}`);
      fs.unlinkSync(targetAdventureZip);
    }

    logger.info(
      `${config.sourceDir} to ${path.join(config.outputDir, "assets")}`
    );

    FileHelper.checkDirectories([config.outputDir]);

    // To copy a folder or file
    fse.copySync(
      config.sourceDir,
      path.join(config.outputDir, "assets")
    );

    // copy assets files
    const assetFilePath = path.join(
      config.assetsInfoDir,
      config.bookCode
    );
    if (fs.existsSync(assetFilePath)) {
      fse.copySync(assetFilePath, path.join(config.outputDir, "assets"));
    }

    // remove copied db
    const copiedDbPath = path.join(
      config.outputDir,
      "assets",
      `${config.bookCode}.db3`
    );
    logger.info(copiedDbPath);
    if (fs.existsSync(copiedDbPath)) {
      try {
        fs.unlinkSync(copiedDbPath);
        //file removed
      } catch (err) {
        logger.error(err);
      }
    }
    logger.info("Directory reset complete");
  }
}

exports.FileHelper = FileHelper;

