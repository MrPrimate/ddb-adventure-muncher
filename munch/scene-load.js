"use strict";

const configure = require("./config.js");
const utils = require("./utils.js");
const _ = require("lodash");
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
  utils.saveJSONFile(adjustments, sceneDataPath);
}

function listSceneIds(bookCode) {
  let idTable = configure.getLookups();

  if (!idTable[bookCode]) {
    console.log(`No ids found for book code ${bookCode}`);
    exit();
  }
  idTable[bookCode].filter((r) => r.docType == "Scene").forEach(r => {
    console.log(`${r.name} => ${r.contentChunkId}`);
  });
}

function importScene(conf, sceneFile) {
  // let config = conf;
  if (conf) {
    console.log("Config loaded!");
  }
  let idTable = configure.getLookups();
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
  if (!idTable[bookCode]) {
    console.log(`Please generate the adventure ${bookCode} before attempting scene import.`);
  }

  let scenesData = getSceneAdjustments(bookCode);

  let lookup = (inData.flags.ddb && inData.flags.ddb.contentChunkId) ?
    idTable[bookCode].find((r) =>
      r.docType == "Scene" &&
      r.contentChunkId && inData.flags.ddb.contentChunkId &&
      r.contentChunkId === inData.flags.ddb.contentChunkId &&
      r.ddbId === inData.flags.ddb.ddbId &&
      r.parentId === inData.flags.ddb.parentId &&
      r.cobaltId === inData.flags.ddb.cobaltId
    ) : 
    null;

  if (lookup) {
    console.log(`Found scene "${lookup.name}" in book "${bookCode}" with contentID ${inData.flags.ddb.contentChunkId}`);
  } else {
    console.log(`Unable to parse with contentID - trying scene name match for "${inData.name}" in "${bookCode}"`);
    lookup = idTable[bookCode].find((r) =>
      r.docType == "Scene" &&
      r.name.toLowerCase().trim().replace("’", "").replace("'","").includes(inData.name.toLowerCase().replace("’", "").replace("'","").trim())
    );
    if (lookup) {
      console.log(`Matched Scene "${lookup.name}" in book "${bookCode}" using name match "${inData.name}"`);
    } else {
      console.log("Unable to match scene.");
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

  console.log("********************");
  console.log("Lookup data:");
  console.log(lookup);
  // console.log(scenesData)
  let sceneData = (lookup.contentChunkId) ? 
    scenesData.find((scene) =>
      scene.flags.ddb && scene.flags.ddb.contentChunkId &&
      lookup.contentChunkId.trim() == scene.flags.ddb.contentChunkId.trim() &&
      lookup.ddbId === scene.flags.ddb.ddbId &&
      lookup.parentId === scene.flags.ddb.parentId &&
      lookup.cobaltId === scene.flags.ddb.cobaltId
    ) :
    scenesData.find((scene) => lookup.name.toLowerCase().trim().replace("’", "").replace("'","").includes(scene.name.toLowerCase().trim().replace("’", "").replace("'","")));

  // if (!sceneData && lookup.contentChunkId) {
  //   sceneData = scenesData.find((scene) => lookup.name.toLowerCase().trim().replace("’", "").replace("'","").includes(scene.name.toLowerCase().trim().replace("’", "").replace("'","")));
  // }

  console.log("********************");
  if (sceneData) {
    console.log("Existing Scene Data Found:");
    console.log(`Name: ${sceneData.name}`);
    console.log(`Walls: ${sceneData.walls.length}`);
    console.log(`Lights: ${sceneData.lights.length}`);
    if (sceneData.drawings) console.log(`Drawings: ${sceneData.drawings.length}`);
    const flags = sceneData.flags.ddb;
    if (flags) {
      if (flags.notes) console.log(`Notes: ${flags.notes.length}`); 
      if (flags.tokens) console.log(`Tokens: ${flags.tokens.length}`); 
    }
  }
  else {
    console.log("Existing scene data not found");
  }
  console.log("********************");
  
  // remove things we can't deal with right now
  delete(inData.descriptions);

  if (inData.flags.ddb) {
    const newFlags = {
      ddb: {
        ddbId: inData.flags.ddb.ddbId,
        cobaltId: inData.flags.ddb.cobaltId,
        parentId: inData.flags.ddb.parentId,
        contentChunkId: inData.flags.ddb.contentChunkId,
        notes: inData.flags.ddb.notes,
        tokens: inData.tokens.map((token) => {
          delete(token.bar2);
          delete(token.displayName);
          return token;
        }),
      }
    };
    newFlags.stairways = inData.flags.stairways ? inData.flags.stairways : [];
    delete(inData.flags);
    inData.flags = newFlags;
  } else {
    delete(inData.flags);
  }
  // we have moved tokens to flags for future use = they will need to be "jigged"
  delete(inData.tokens);

  inData.name = lookup.name;
  if (inData.navName == "") delete((inData.navName));

  // console.log(sceneData);
  //exit();
  if (sceneData) {
    if (sceneData.flags && sceneData.flags.ddb && sceneData.flags.ddb.notes) sceneData.flags.ddb.notes = [];
    sceneData.walls = [];
    sceneData.drawings = [];
    sceneData.lights = [];
    sceneData.walls = [];
    sceneData.tokens = [];
    if (sceneData.navName) sceneData.navName = sceneData.navName.trim();
    sceneData = _.merge(sceneData, inData);
    const index = (sceneData.flags.ddb.contentChunkId) ?
      _.findIndex(scenesData, {"flags.ddb.contentChunkId": lookup.contentChunkId}) :
      _.findIndex(scenesData, {name: sceneData.name});
    scenesData.splice(index, 1, sceneData);
  } else {
    if (!inData.flags) inData.flags = { 
      ddb: {
        lookupDDB: true,
        ddbId: lookup.ddbId,
        cobaltId: lookup.cobaltId,
        parentId: lookup.parentId,
        contentChunkId: lookup.contentChunkId,
      }
    };
    scenesData.push(inData);
  }

  saveSceneAdjustments(scenesData, bookCode);

}

exports.importScene = importScene;
exports.getSceneAdjustments = getSceneAdjustments;
exports.setSceneDir = setSceneDir;
exports.listSceneIds = listSceneIds;
