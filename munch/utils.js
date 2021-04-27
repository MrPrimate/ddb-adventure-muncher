const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const extract = require('extract-zip')
const fse = require('fs-extra');
const sizeOf = require('image-size');
const fetch = require("node-fetch");

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
      console.log(`${targetFile} written.`);
    });
}

async function unzipFile(filePath, destination) {
  try {
    await extract(filePath, { dir: destination })
    console.log('Extraction complete')
  } catch (err) {
    // handle any errors
  }
}

function downloadFile(url, destination) {
  const options = {
    url: url,
    encoding: null
  };

  return new Promise((resolve, reject) => {
    fetch(url, options)
    .then((res) => {
      const dest = fs.createWriteStream(destination);
      res.body.pipe(dest);
      res.body.on('end', () => resolve());
      dest.on('error', reject);
    })
    .catch(error => {
      console.log('error', error);
      reject(error);
    });
  });
}


function randomString(length, chars) {
  var mask = "";
  if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.indexOf("#") > -1) mask += "0123456789";
  if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  var result = "";
  for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

function zeroPad(num, places) {
  return String(num).padStart(places, '0');
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
    console.log(`Config file saved to ${filePath}`);
  } catch (error) {
    console.log(error);
  }
}

function directoryReset(config) {
  // delete directory recursively
  config.subDirs.forEach((d) => {
    if (fs.existsSync(path.join(config.run.outputDir,d))) {
      fs.rmdir(path.join(config.run.outputDir,d), { recursive: true }, (err) => {
        if (err) {
            throw err;
        }
      });
    }
  })
  // delete adventure zip
  const targetAdventureZip = path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`);
  if (fs.existsSync(targetAdventureZip)) {
    console.log(`Removing ${targetAdventureZip}`);
    fs.unlinkSync(targetAdventureZip);
  }

  console.log(`${config.run.sourceDir} to ${path.join(config.run.outputDir,"assets")}`);

  if (!fs.existsSync(config.run.outputDir)) {
    fs.mkdirSync(config.run.outputDir);
  }

  // To copy a folder or file
  fse.copySync(config.run.sourceDir, path.join(config.run.outputDir,"assets"));

  // remove copied db
  const copiedDbPath = path.join(config.run.outputDir,"assets",`${config.run.bookCode}.db3`);
  console.log(copiedDbPath)
  if (fs.existsSync(copiedDbPath)) {
    try {
      fs.unlinkSync(copiedDbPath);
      //file removed
    } catch(err) {
      console.error(err)
    }
  }
}

const SKIPPING_WORDS = [
  "the", "of", "at", "it", "a,"
];
function titleString (text) {
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

function imageSize(image) {
  let size = {
    height: 2000,
    width: 2000, 
  }
  if (fs.existsSync(image)) {
    try {
      size = sizeOf(image);
    } catch (e) {
      console.error(`Error getting size of ${image}`);
      console.log(e.stack);
    }
  }
  return size;
}

exports.randomString = randomString;
exports.getZipOfFolder = getZipOfFolder;
exports.writeZipFile = writeZipFile;
exports.unzipFile = unzipFile;
exports.zeroPad = zeroPad;
exports.loadJSONFile = loadJSONFile;
exports.saveJSONFile = saveJSONFile;
exports.loadConfig = loadConfig;
exports.saveConfig = saveJSONFile;
exports.directoryReset = directoryReset;
exports.titleString = titleString;
exports.imageSize = imageSize;
exports.downloadFile = downloadFile;
