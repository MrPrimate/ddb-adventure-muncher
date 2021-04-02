const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const extract = require('extract-zip')
const fse = require('fs-extra');
const sizeOf = require('image-size');

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

  let allPaths = getFilePathsRecursively(dir);

  let zip = new JSZip();
  for (let filePath of allPaths) {
    // let addPath = path.relative(path.join(dir, '..'), filePath); // use this instead if you want the source folder itself in the zip
    let addPath = path.relative(dir, filePath); // use this instead if you don't want the source folder itself in the zip
    let data = fs.readFileSync(filePath);
    let stat = fs.lstatSync(filePath);
    let permissions = stat.mode;

    if (stat.isSymbolicLink()) {
      zip.file(addPath, fs.readlinkSync(filePath), {
        unixPermissions: parseInt("120755", 8), // This permission can be more permissive than necessary for non-executables but we don't mind.
        dir: stat.isDirectory(),
      });
    } else {
      zip.file(addPath, data, {
        unixPermissions: permissions,
        dir: stat.isDirectory(),
      });
    }
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
  const prefixSplit = text.replace("\r\n", " ").split(":");
  const words = (prefixSplit.length > 1) ? prefixSplit[1].trim().split(" ") : text.split(" ");

  for (let i = 0; i < words.length; i++) {
    if (i == 0 || !SKIPPING_WORDS.includes(words[i])) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
  }

  const prefix = (prefixSplit.length > 1) ? `${prefixSplit[0]}: ` : "";

  return prefix + words.join(" ");
}

function imageSize(image) {
  return sizeOf(image);
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
