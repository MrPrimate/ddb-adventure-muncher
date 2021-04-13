const configure = require("./config.js");
const book = require("./book.js");
const utils = require("./utils.js");
const ddb = require("./ddb.js");
const { exists } = require("fs-extra");
const _ = require('lodash');
const fs = require("fs");
const path = require("path");
const { exit } = require("process");

var sceneDir = path.join("..", "content", "scene_info");

function setSceneDir (dir) {
  sceneDir = dir;
}

function getSceneAdjustments(bookCode) {
  let scenesData = [];
  const sceneDataFile = path.join(sceneDir, `${bookCode}.json`);
  const sceneDataPath = path.resolve(__dirname, sceneDataFile);

  if (fs.existsSync(sceneDataPath)){
    scenesData = utils.loadJSONFile(sceneDataPath);
  }
  return scenesData;
}

function saveSceneAdjustments(adjustments, bookCode) {
  const sceneDataFile = path.join(sceneDir, `${bookCode}.json`);
  const sceneDataPath = path.resolve(__dirname, sceneDataFile);

  if (fs.existsSync(sceneDataPath)){
    scenesData = utils.loadJSONFile(sceneDataPath);
  }

  utils.saveJSONFile(adjustments, sceneDataPath);
}

function importScene(conf, sceneFile) {
  config = conf;
  idTable = configure.getLookups();
  console.log(`Loading scene info from ${sceneFile}`);

  let inData;

  const configFile = path.resolve(__dirname, sceneFile);
  if (fs.existsSync(configFile)){
    inData = utils.loadJSONFile(configFile);
  } else {
    console.log("FILE NOT FOUND!");
    return;
  }

  // console.log(inData)

  const bookCode = (inData.flags.ddb && inData.flags.ddb.bookCode) ?
    inData.flags.ddb.bookCode :
    (inData.flags.vtta && inData.flags.vtta.code) ?
    inData.flags.vtta.code : undefined;
  if (!bookCode) {
    console.log("What book is this from? Exiting!");
    return;
  }

  let scenesData = getSceneAdjustments(bookCode);

  let lookup = idTable[bookCode].find((r) =>
      r.docType == "Scene" &&
      r.contentChunkId && inData.flags.ddb.contentChunkId &&
      r.contentChunkId === inData.flags.ddb.contentChunkId
    );

  if (lookup) {
    console.log(`Found scene "${lookup.name}" in book "${bookCode}" with contentID ${inData.flags.ddb.contentChunkId}`);
  } else {
    console.log(`I have not parsed a scene with the contentID trying scene name match for "${inData.name}" in "${bookCode}"`);
    lookup = idTable[bookCode].find((r) =>
      r.docType == "Scene" &&
      r.name.includes(inData.name)
    );
    if (lookup) {
      console.log(`Matched Scene "${lookup.name}" in book "${bookCode}" using name match`);
    } else {
      console.log(`Unable to match scene.`);
      return;
    }
    
  }

 // config.lookups["monsters"];
  // const lookupValue = config.lookups[COMPENDIUM_MAP[lookupKey]];
  // if (lookupValue) {
  //   const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
  //   if (lookupEntry) {
  //     text = text.replace(node.outerHTML, `@Compendium[${lookupEntry.compendium}.${lookupEntry._id}]{${node.textContent}}`);
  //   } else {

  // no tokens in the world right now, so we ignore these
  // rawData.tokens = rawData.tokens
  //   .filter((token) => config.lookups["monsters"].some((m) => m.name == token.name))
  //   .map((token) => {
  //     const compendiumMonster = config.lookups["monsters"].find((m) => m.name == token.name);
  //     token =
  //     token.actorId = compendiumMonster._id;
  //     token.img = compendiumMonster.img;
  //   });

  // console.log(scenesData)
  let sceneData = (lookup.contentChunkId) ? 
    scenesData.find((scene) => lookup.contentChunkId === scene.flags.ddb.contentChunkId) :
    scenesData.find((scene) => lookup.name.includes(scene.name));


  // remove things we can't deal with right now
  delete(inData.tokens);
  delete(inData.descriptions);

  const newFlags = {
    ddb: {
      ddbId: inData.flags.ddb.ddbId,
      cobaltId: inData.flags.ddb.cobaltId,
      contentChunkId: inData.flags.ddb.contentChunkId,
    }
  };

  delete(inData.flags);
  inData.flags = newFlags;

  inData.name = lookup.name;
  if (inData.navName == "") delete((inData.navName));

  // console.log(sceneData);
  //exit();
  if (sceneData) {
    sceneData = _.merge(sceneData, inData);
    const index = (lookup.contentChunkId) ?
      _.findIndex(scenesData, {"flags.ddb.contentChunkId": lookup.contentChunkId}) :
      _.findIndex(scenesData, {name: lookup.name});
    scenesData.splice(index, 1, sceneData);
  } else {
    scenesData.push(inData);
  }

  saveSceneAdjustments(scenesData, bookCode);

}

exports.importScene = importScene;
exports.getSceneAdjustments = getSceneAdjustments;
exports.setSceneDir = setSceneDir;
