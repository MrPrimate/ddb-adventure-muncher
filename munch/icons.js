"use strict";

const utils = require("./utils.js");
const fs = require("fs");
const path = require("path");
const logger = require("./logger.js");

function unPad(match, p1) {
  if (isNaN(parseInt(p1))) {
    return p1;
  } else {
    return parseInt(p1);
  }
}

function generateIcon(config, title, templateDir) {
  // default path
  let iconPath = "icons/svg/book.svg";
  let stub = title.trim().split(".")[0].split(" ")[0];
  stub = stub.replace(/(\d+)/, unPad);
  if (stub.length <= 4) {
    const svgDirPath = path.join(config.run.outputDir,"assets","icons");
    iconPath = path.join("assets","icons",`${stub}.svg`);
    const iconFileOutPath = path.join(config.run.outputDir,iconPath);
    if (!fs.existsSync(svgDirPath)) fs.mkdirSync(svgDirPath);
    if (!fs.existsSync(iconFileOutPath)) {
      logger.info(stub);
      const svgTemplate = path.join(templateDir,`${stub.length}char.svg`);
      logger.info(svgTemplate);
      let svgContent = utils.loadFile(svgTemplate);
      svgContent = svgContent.replace("REPLACEME", stub);
      utils.saveFile(svgContent, iconFileOutPath);
    }
  }
  return iconPath.split(path.sep).join(path.posix.sep);
}

exports.generateIcon = generateIcon;
