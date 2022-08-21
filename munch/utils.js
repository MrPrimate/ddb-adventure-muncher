const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const extract = require("extract-zip");
const fse = require("fs-extra");
const fetch = require("node-fetch");
const logger = require("./logger.js");

function getFilePathsRecursively(dir) {
  // returns a flat array of absolute paths of all files recursively contained in the dir
  let results = [];
  let list = fs.readdirSync(dir);

  var pending = list.length;
  if (!pending) return results;

  for (let file of list) {
    file = path.resolve(dir, file);

    let stat = fs.lstatSync(file);

    if (stat && stat.isDirectory()) {
      results = results.concat(getFilePathsRecursively(file));
    } else {
      results.push(file);
    }

    if (!--pending) return results;
  }

  return results;
}

function getZipOfFolder(dir) {
  // returns a JSZip instance filled with contents of dir.

  const allPaths = getFilePathsRecursively(path.resolve(dir));

  let zip = new JSZip();
  for (const filePath of allPaths) {
    const addPath = path.relative(dir, filePath);
    const data = fs.readFileSync(filePath);
    const stat = fs.lstatSync(filePath);
    const binary = (filePath.endsWith(".json")) ? false : true;

    zip.file(addPath.split(path.sep).join(path.posix.sep), data, {
      dir: stat.isDirectory(),
      binary: binary,
      createFolders: true,
    });
  }

  return zip;
}

function writeZipFile(zip, targetFile) {
  zip
    .generateNodeStream({ type: "nodebuffer", streamFiles: true })
    .pipe(fs.createWriteStream(targetFile))
    .on("finish", function () {
      // JSZip generates a readable stream with a "end" event,
      // but is piped here in a writable stream which emits a "finish" event.
      logger.info(`${targetFile} written.`);
    });
}

async function unzipFile(filePath, destination) {
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

function fetchWithTimeout(url, options, timeout = 15000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    )
  ]);
}

function fetchFile(url, destination, timeout = 15000) {
  logger.info(`Downloading ${url} to ${destination} (timeout: ${timeout})`);
  const options = {
    url: url,
    encoding: null
  };

  return new Promise((resolve, reject) => {
    fetchWithTimeout(url, options, timeout)
      .then((res) => {
        const dest = fs.createWriteStream(destination);
        res.body.pipe(dest);
        dest.on("finish", function() {
          dest.close();
          resolve(destination);
        });
        dest.on("error", reject);
      })
      .catch(error => {
        logger.error("error", error);
        reject(error);
      });
  });
}

function downloadFile(url, destination, timeout = 1500, count = 0, maxcount = 5, error = null) {
  return new Promise((resolve, reject) => {
    if (count === maxcount) {
      logger.error("Max attempts reached. Download error:", error);
      fs.rm(destination);
      reject(error);
    }
    else {
      try {
        fetchFile(url, destination, timeout)
          .then((destination) => {
            resolve(destination);
          });
      } catch (err) {
        logger.error(`Failed to download ${url} to ${destination} (Attempt ${count + 1} of ${maxcount})`);
        fs.rm(destination);
        resolve(downloadFile(url, destination, timeout, count + 1, maxcount, err));
      }
    }
  });
}

function randomString(length, chars) {
  let mask = "";
  if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.indexOf("#") > -1) mask += "0123456789";
  if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  let result = "";
  for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

function loadFile(file) {
  const filePath = path.resolve(__dirname, file);
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

function loadJSONFile(file) {
  const configPath = path.resolve(__dirname, file);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(JSON.stringify(require(configPath)));
    return config;
  } else {
    return {};
  }
}

function loadConfig(file) {
  const config = loadJSONFile(file);

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
function saveJSONFile(content, filePath) {
  try{
    const data = JSON.stringify(content, null, 4);
    fs.writeFileSync(filePath, data);
    logger.info(`JSON file saved to ${filePath}`);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Save text in a file
 * @param {*} content
 * @param {*} file
 */
function saveFile(content, filePath) {
  try{
    fs.writeFileSync(filePath, content);
    logger.info(`File saved to ${filePath}`);
  } catch (error) {
    logger.error(error);
  }
}

function directoryReset(config) {
  // delete directory recursively
  config.subDirs.forEach((d) => {
    if (fs.existsSync(path.join(config.run.outputDir,d))) {
      fs.rm(path.join(config.run.outputDir,d), { recursive: true }, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  });
  // delete adventure zip
  const targetAdventureZip = path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`);
  if (fs.existsSync(targetAdventureZip)) {
    logger.info(`Removing ${targetAdventureZip}`);
    fs.unlinkSync(targetAdventureZip);
  }

  logger.info(`${config.run.sourceDir} to ${path.join(config.run.outputDir,"assets")}`);

  if (!fs.existsSync(config.run.outputDir)) {
    fs.mkdirSync(config.run.outputDir);
  }

  // To copy a folder or file
  fse.copySync(config.run.sourceDir, path.join(config.run.outputDir,"assets"));

  // copy assets files
  const assetFilePath = path.join(config.run.assetsInfoDir, config.run.bookCode);
  if (fs.existsSync(assetFilePath)) {
    fse.copySync(assetFilePath, path.join(config.run.outputDir,"assets"));
  }

  // remove copied db
  const copiedDbPath = path.join(config.run.outputDir,"assets",`${config.run.bookCode}.db3`);
  logger.info(copiedDbPath);
  if (fs.existsSync(copiedDbPath)) {
    try {
      fs.unlinkSync(copiedDbPath);
      //file removed
    } catch(err) {
      logger.error(err);
    }
  }
  logger.info("Directory reset complete");
}

const SKIPPING_WORDS = [
  "the", "of", "at", "it", "a"
];
function titleString (text) {
  //if (!text || text === "") return "";
  const prefixSplit = text.replace("\r\n", " ").trim().split(":");
  const words = (prefixSplit.length > 1) ? prefixSplit[1].trim().split(" ") : text.trim().split(" ");

  for (let i = 0; i < words.length; i++) {
    if (i == 0 || !SKIPPING_WORDS.includes(words[i])) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
  }

  const prefix = (prefixSplit.length > 1) ? `${prefixSplit[0]}: ` : "";

  return prefix + words.join(" ");
}

exports.randomString = randomString;
exports.getZipOfFolder = getZipOfFolder;
exports.writeZipFile = writeZipFile;
exports.unzipFile = unzipFile;
exports.zeroPad = zeroPad;
exports.loadJSONFile = loadJSONFile;
exports.saveJSONFile = saveJSONFile;
exports.saveFile = saveFile;
exports.loadFile = loadFile;
exports.loadConfig = loadConfig;
exports.saveConfig = saveJSONFile;
exports.directoryReset = directoryReset;
exports.titleString = titleString;
exports.downloadFile = downloadFile;
