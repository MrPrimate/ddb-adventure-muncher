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

function saveIndividualScenes(adjustments, bookCode) {
  adjustments.forEach((adjustment) => {
    const flags = adjustment.flags.ddb;
    const ddbId = flags.ddbId;
    const cobaltId = flags.cobaltId ? `-${flags.cobaltId}` : "";
    const parentId = flags.parentId ? `-${flags.parentId}` : "";
    const contentChunkId = flags.contentChunkId ? `-${flags.contentChunkId}` : "";
    const sceneRef = `${bookCode}-${ddbId}${cobaltId}${parentId}${contentChunkId}`;
    const sceneDataDir = path.join(sceneDir, bookCode);
    const sceneDataFile = path.join(sceneDataDir, `${sceneRef}-scene.json`);

    console.log(`Sceneref: ${sceneRef}`);
    // console.log(`sceneDataDir: ${sceneDataDir}`);
    // console.log(`sceneDataFile: ${sceneDataFile}`);
    const sceneDataPath = path.resolve(__dirname, sceneDataFile);

    console.log(`Exporting datafile ${sceneDataPath}`);
    if (!fs.existsSync(sceneDataDir)) {
      console.log(`Creating dir ${sceneDataDir}`);
      fs.mkdirSync(sceneDataDir);
    }
    if (fs.existsSync(sceneDataPath)){
      console.log(`ERROR! Scene ${sceneDataPath} exists!!!`);
    }
    utils.saveJSONFile(adjustment, sceneDataPath);
  });
}

function saveSceneAdjustments(adjustments, bookCode) {
  const sceneDataFile = path.join(sceneDir, `${bookCode}.json`);
  const sceneDataPath = path.resolve(__dirname, sceneDataFile);
  utils.saveJSONFile(adjustments, sceneDataPath);
  // saveIndividualScenes(adjustments, bookCode);
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
    console.log(`Loading ${configFile}`);
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

  const lookupFilter = (inData.flags.ddb && inData.flags.ddb.contentChunkId) ?
    idTable[bookCode].filter((r) =>
      r.docType == "Scene" &&
      r.contentChunkId && inData.flags.ddb.contentChunkId &&
      r.contentChunkId == inData.flags.ddb.contentChunkId
    ) : 
    null;

  let lookup = (inData.flags.ddb && inData.flags.ddb.contentChunkId) ?
    idTable[bookCode].find((r) =>
      r.docType == "Scene" &&
      r.contentChunkId && inData.flags.ddb.contentChunkId &&
      r.contentChunkId == inData.flags.ddb.contentChunkId &&
      r.ddbId == inData.flags.ddb.ddbId &&
      r.parentId == inData.flags.ddb.parentId &&
      r.cobaltId == inData.flags.ddb.cobaltId
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

  if (!lookupFilter || lookupFilter.length === 0){
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("CATASTROPHIC SCENE FAILURE!!!!!  No scenes at allll!");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    //exit();
  }
  if (lookupFilter && (lookup && lookupFilter.length > 1) || (!lookup && lookupFilter.length > 0)) {
    console.log("######################################");
    console.log(`Scene Mismatch failure: ${inData.name}`);
    if (lookupFilter.length > 1) {
      console.log("######################################");
      console.log("######################################");
      console.log("######################################");
      console.log("Multiple Scene match, oh noes, but this might not be a problem");
      console.log("######################################");
      console.log("######################################");
      console.log("######################################");
      // exit();
    } else {
      console.log(`IN: ${inData.flags.ddb.contentChunkId } : ${inData.flags.ddb.ddbId }: ${inData.flags.ddb.cobaltId }: ${inData.flags.ddb.parentId }`);
      const singleMatch = lookupFilter[0];
      // console.log(singleMatch);
      console.log(`LO: ${singleMatch.contentChunkId } : ${singleMatch.ddbId }: ${singleMatch.cobaltId }: ${singleMatch.parentId }`);
      console.log("Correcting indata...");
      inData.flags.ddb.ddbId = singleMatch.ddbId;
      inData.flags.ddb.cobaltId = singleMatch.cobaltId;
      inData.flags.ddb.parentId = singleMatch.parentId;
      inData.flags.ddb.bookCode = bookCode;
      inDataUpdate = true;
      lookup = singleMatch;
    }
    console.log("######################################");
  } else {
    console.log("All checks pass!");
  }

  // are we rewriting this indata file?
  let inDataUpdate = false;


  // notes
  console.log("********************");
  if (inData && inData.flags.ddb && inData.flags.ddb.notes) {
    console.log("Updating note flags");
    const notes = inData.flags.ddb.notes.map((note) => {
      if (note.flags.contentChunkId) {
        inDataUpdate = true;
        const newFlags = JSON.parse(JSON.stringify(note.flags));
        note.flags = {
          ddb: newFlags,
        };
      }
      return note;
    });
    
    inData.flags.ddb.notes = notes;
  }

  // remove things we can't deal with right now
  delete(inData.descriptions);

  // tokens
  console.log("********************");
  let tokens = [];

  if (inData && inData.tokens && inData.tokens.length > 0) {
    console.log("Moving token data");
    tokens = inData.tokens;
    inDataUpdate = true;
  } else if (inData.flags.ddb && inData.flags.ddb.tokens) {
    tokens = JSON.parse(JSON.stringify(inData.flags.ddb.tokens));
  }

  console.log("Cleaning token data");
  const finalTokens = tokens.map((token) => {
    if (token.actorData) {
      delete(token.actorData.items);
      delete(token.actorData.effects);
      // /if (token.actorData.data) delete(token.actorData.data.details);
    }
    delete(token.effects);
    delete(token.img);
    delete(token.bar2);
    delete(token.displayName);
    return token;
  });

  if (!_.isEqual(finalTokens, tokens)) inDataUpdate = true;

  if (inData.navName == "") {
    inDataUpdate = true;
    delete inData.navName;
  }

  console.log("********************");

  console.log("Flag check...")
  // flags
  if (inData.flags.ddb) {
    const newFlags = {
      ddb: {
        bookCode: bookCode,
        ddbId: lookup.ddbId,
        cobaltId: lookup.cobaltId,
        parentId: lookup.parentId,
        contentChunkId: lookup.contentChunkId,
        notes: inData.flags.ddb.notes,
        tokens: inData.flags.ddb.tokens,
      }
    };
    newFlags.stairways = inData.flags.stairways ? inData.flags.stairways : [];
    newFlags["perfect-vision"] = inData.flags["perfect-vision"] ? inData.flags["perfect-vision"] : [];
    newFlags["dynamic-illumination"] = inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : [];

    if (!_.isEqual(inData.flags, newFlags)) inDataUpdate = true;
    inData.flags = newFlags;
  } else {
    inData.flags = { 
      ddb: {
        bookCode: bookCode,
        ddbId: lookup.ddbId,
        cobaltId: lookup.cobaltId,
        parentId: lookup.parentId,
        contentChunkId: lookup.contentChunkId,
      },
      stairways: inData.flags.stairways ? inData.flags.stairways : [],
      "perfect-vision": inData.flags["perfect-vision"] ? inData.flags["perfect-vision"] : [],
      "dynamic-illumination": inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : [],
    };
    inDataUpdate = true;
  }

  inData.flags.ddb.tokens = finalTokens;

  if (!inData.flags.ddb.bookCode) {
    inData.flags = { 
      ddb: {
        bookCode: bookCode,
        ddbId: lookup.ddbId,
        cobaltId: lookup.cobaltId,
        parentId: lookup.parentId,
        contentChunkId: lookup.contentChunkId,
      },
      stairways: inData.flags.stairways ? inData.flags.stairways : [],
      "perfect-vision": inData.flags["perfect-vision"] ? inData.flags["perfect-vision"] : [],
      "dynamic-illumination": inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : [],
    };
    inDataUpdate = true;
  }

  // tokens exist in the flags and are regenerated later
  delete inData.tokens;

  if (inData.flags && inData.flags.ddb && inData.flags.ddb.contentChunkId && !inData.flags.ddb.contentChunkId.startsWith("ddb-missing")) {
    inData.name = lookup.name;
    inDataUpdate = true;
  };

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
    scenesData.push(inData);
  }

  inData.walls = inData.walls.map((wall) => {
    delete wall._id;
    delete wall.flags;
    return wall;
  });
  delete inData.wall;
  
  inData = _(inData).toPairs().sortBy(0).fromPairs().value();

  if (inDataUpdate || true) {
    console.log("UPDAING INDATA!");
    utils.saveJSONFile(inData, configFile);
  }

  saveIndividualScenes([inData], bookCode);

  saveSceneAdjustments(scenesData, bookCode);

}

exports.importScene = importScene;
exports.getSceneAdjustments = getSceneAdjustments;
exports.setSceneDir = setSceneDir;
exports.listSceneIds = listSceneIds;
