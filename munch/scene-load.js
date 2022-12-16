"use strict";

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const { exit } = require("process");

const { Config } = require("./adventure/Config.js");
const { Adventure } = require("./adventure/Adventure.js");
const { FileHelper } = require("./adventure/FileHelper.js");

function saveIndividualScenes(adjustments, conf) {
  adjustments.forEach((adjustment) => {
    const flags = adjustment.flags.ddb;
    const ddbId = flags.ddbId;
    const cobaltId = flags.cobaltId ? `-${flags.cobaltId}` : "";
    const parentId = flags.parentId ? `-${flags.parentId}` : "";
    const contentChunkId = flags.contentChunkId ? `-${flags.contentChunkId}` : "";
    const sceneRef = `${conf.bookCode}-${ddbId}${cobaltId}${parentId}${contentChunkId}`;
    const sceneDataDir = path.join(conf.sceneInfoDir, conf.bookCode);
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
      console.log(`Scene ${sceneDataPath} exists, replacing.`);
    }
    FileHelper.saveJSONFile(adjustment, sceneDataPath);
  });
}

function listSceneIds(bookCode) {
  const config = new Config();
  config.loadBook(bookCode);
  const adventure = new Adventure(config);
  adventure.getLookups();
  let idTable = adventure.ids;

  if (!idTable[adventure.bookCode]) {
    console.log(`No ids found for book code ${bookCode}`);
    exit(1);
  }
  idTable[adventure.bookCode].filter((r) => r.docType == "Scene").forEach(r => {
    console.log(`${r.name} => ${r.contentChunkId}`);
  });
}

function getDDBMetaData(conf) {
  const meta = FileHelper.loadJSONFile(path.resolve(conf.sceneInfoDir, "../meta.json"));
  return meta;
}

function updateDDBMetaData(conf, key, update) {
  const metaPath = path.resolve(conf.sceneInfoDir, "../meta.json");
  const meta = FileHelper.loadJSONFile(metaPath);
  meta.scenes[key] = update;
  FileHelper.saveJSONFile(meta, metaPath);
}

async function importScene(conf, sceneFile) {

  console.log(`Loading scene info from ${sceneFile}`);

  let inData;
  // are we rewriting this indata file?
  let inDataUpdate = false;

  const configFile = path.resolve(__dirname, sceneFile);
  if (fs.existsSync(configFile)){
    console.log(`Loading ${configFile}`);
    inData = FileHelper.loadJSONFile(configFile);
  } else {
    console.log("FILE NOT FOUND!");
    return;
  }

  const bookCode = (inData.flags.ddb && inData.flags.ddb.bookCode)
    ? inData.flags.ddb.bookCode
    : (inData.flags.vtta && inData.flags.vtta.code)
      ? inData.flags.vtta.code : undefined;
  if (bookCode) {
    console.log(`Loading ${bookCode}`);
    await conf.loadBook(bookCode);
  } else {
    console.log("What book is this from? Exiting!");
    return;
  }

  const adventure = new Adventure(conf);
  let idTable = adventure.getLookups(true);

  if (!idTable[bookCode]) {
    console.error(`Please generate the adventure ${bookCode} before attempting scene import.`);
    exit(-2);
  }

  const ddbMetaData = getDDBMetaData(conf);
  const ddbMetaDataVersion = ddbMetaData.version;
  console.log(`DDB Meta Data Version: ${ddbMetaDataVersion}`);

  adventure.loadSceneAdjustments();
  let scenesData = adventure.enhancements.sceneAdjustments;

  const lookupFilter = (inData.flags.ddb && inData.flags.ddb.contentChunkId)
    ? idTable[bookCode].filter((r) =>
      r.docType == "Scene"
      && r.contentChunkId && inData.flags.ddb.contentChunkId
      && r.contentChunkId == inData.flags.ddb.contentChunkId
    ) 
    : null;

  let lookup = (inData.flags.ddb && inData.flags.ddb.contentChunkId)
    ? idTable[bookCode].find((r) =>
      r.docType == "Scene"
      && r.contentChunkId && inData.flags.ddb.contentChunkId
      && r.contentChunkId == inData.flags.ddb.contentChunkId
      && r.ddbId == inData.flags.ddb.ddbId
      && r.parentId == inData.flags.ddb.parentId
      && r.cobaltId == inData.flags.ddb.cobaltId
    ) 
    : null;

  if (lookup) {
    console.log(`Found scene "${lookup.name}" in book "${bookCode}" with contentID ${inData.flags.ddb.contentChunkId}`);
  } else {
    console.log(`Unable to parse with contentID - trying scene name match for "${inData.name}" in "${bookCode}"`);
    lookup = idTable[bookCode].find((r) =>
      r.docType == "Scene"
      && r.name.toLowerCase().trim().replace("’", "").replace("'","").includes(inData.name.toLowerCase().replace("’", "").replace("'","").trim())
    );
    if (lookup) {
      console.log(`Matched Scene "${lookup.name}" in book "${bookCode}" using name match "${inData.name}"`);
    } else {
      console.log(`Falling back to img match for ${inData.img}`);
      lookup = idTable[bookCode].find((r) =>
        r.docType == "Scene"
        && inData.flags.ddb.img
        && inData.flags.ddb.img.includes(r.img)
      );
      if (lookup) {
        console.log(`Matched Scene "${lookup.name}" in book "${bookCode}" using img match "${inData.img}"`);
      } else {
        console.log(`Falling back to just contentChunkId match for ${inData.img}`);
        lookup = idTable[bookCode].find((r) =>
          r.docType == "Scene"
          && r.contentChunkId && inData.flags.ddb.contentChunkId
          && r.contentChunkId == inData.flags.ddb.contentChunkId
        );
        if (lookup) {
          console.log(`Matched Scene "${lookup.name}" in book "${bookCode}" using pure contentChunkId"`);
        } else {
          console.log("Unable to match scene.");
          return;
        }
      }
    }
    
  }

  if (!lookupFilter || lookupFilter.length === 0){
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("CATASTROPHIC SCENE FAILURE!!!!!  No scenes at all!");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    //exit(1);
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
      // exit(1);
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
      console.log("Indata update from initial data clean");
      lookup = singleMatch;
    }
    console.log("######################################");
  } else {
    console.log("All checks pass!");
  }


  // notes
  console.log("********************");
  if (inData && inData.flags.ddb && inData.flags.ddb.notes) {
    console.log("Updating note flags");
    const notes = inData.flags.ddb.notes.map((note) => {
      if (note.flags.userData) delete note.flags.userData;
      if (note.flags.ddb && note.flags.ddb.userData) delete note.flags.ddb.userData;
      if (note.flags.contentChunkId || note.flags.ddbId) {
        console.log("Indata update from note flags");
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
    console.log("Indata update from moving token data");
  } else if (inData.flags.ddb && inData.flags.ddb.tokens) {
    tokens = JSON.parse(JSON.stringify(inData.flags.ddb.tokens));
  }

  tokens.forEach((token) => {
    if (!token.flags || !token.flags.ddbActorFlags || !token.flags.ddbActorFlags.id) {
      console.warn(`Bad token match for ${token.name}`, token);
      if (token.name) {
        const monsterNameLookup = conf.lookups["monsters"].find((e) => e.name == token.name);
        if (monsterNameLookup) {
          token.flags.ddbActorFlags = {
            id: monsterNameLookup.id,
            name: monsterNameLookup.name,
          };
        } else {
          const monsterPartialNameLookup = conf.lookups["monsters"].find((e) => token.name.includes(e.name));
          if (monsterPartialNameLookup) {
            console.log("***********************************");
            console.log("***********************************");
            console.log(`TOKEN NAME PARTIAL MATCH: ${token.name} to ${monsterPartialNameLookup.name} with id ${monsterPartialNameLookup.id}`);
            console.log("Update this manually");
            // token.flags.ddbActorFlags = {
            //   id: monsterPartialNameLookup.id,
            //   name: monsterPartialNameLookup.name,
            // };
            console.log("***********************************");
            console.log("***********************************");
          }
        }
      } {
        console.log("***********************************");
        console.log("Unnamed token");
        console.log("***********************************");
      }
    }
  });

  console.log("Cleaning token data");
  const finalTokens = tokens
    .filter((token) => token.flags.ddbActorFlags && token.flags.ddbActorFlags.id)
    .map((token) => {
      if (token.actorData) {
        if (token.actorData.flags?.ddbimporter?.keepItems && token.actorData.items) {
          token.flags.ddbItems = token.actorData.items.map((i) => {
            const item = {
              name: i.name,
              type: i.type,
              ddbId: i.flags?.ddbimporter?.id,
              customItem: i.flags?.ddbimporter?.customItem,
              data: i.flags?.ddbimporter?.customItem ? i : {},
            };
            return item;
          });
        }
        token.flags.ddbActorEffects = token.actorData.effects;
        if (token.actorData.flags?.ddbimporter?.keepToken || token.actorData.flags?.ddbimporter?.keepAvatar) {
          token.flags.ddbImages = {
            keepToken: token.actorData.flags.ddbimporter.keepToken ?? false,
            tokenImage: token.actorData.flags.ddbimporter.tokenImage ?? "",
            keepAvatar: token.actorData.flags.ddbimporter.keepAvatar ?? false,
            avatarImage: token.actorData.flags.ddbimporter.avatarImage ?? "",
          };

          if (token.flags.ddbImages.keepToken && token.flags.ddbImages.tokenImage === "") {
            console.error(`ERROR! Could not find token image for ${token.name}`);
            exit(1);
          }
          if (token.flags.ddbImages.keepAvatar && token.flags.ddbImages.avatarImage === "") {
            console.error(`ERROR! Could not find token avatar image for ${token.name}`);
            exit(1);
          }
        }
        delete token.actorData.items;
        delete token.actorData.effects;
        // /if (token.actorData.data) delete(token.actorData.data.details);
      }
      delete token.effects;
      delete token.img;
      delete token.bar2;
      delete token.displayName;
      if (token.flags.compendiumActorId) delete token.flags.compendiumActorId;
      if (token.flags.actorFolderId) delete token.flags.actorFolderId;
      if (!token.flags.ddbActorFlags.name) {
        const monsterLookup = conf.lookups["monsters"].find((e) => e.id == token.flags.ddbActorFlags.id);
        if (monsterLookup) {
          token.flags.ddbActorFlags.name = monsterLookup.name;
        } else {
          console.error(`ERROR! Could not find token lookup for ${token.name} with id ${token.flags.ddbActorFlags.id}`);
          exit(1);
        }
      } else {
        token.name = token.name.replace(/\(\d+\)/, "").trim();
        if (token.actorData.name) token.actorData.name = token.actorData.name.replace(/\(\d+\)/, "").trim();
        if (token.flags.ddbActorFlags.name !== token.name
          && token.name.endsWith(token.flags.ddbActorFlags.name))
        {
          token.name = token.flags.ddbActorFlags.name;
        }
        if (token.actorData.name
          && token.actorData.name !== token.flags.ddbActorFlags.name
          && token.actorData.name.endsWith(token.flags.ddbActorFlags.name)
        ) {
          token.actorData.name = token.flags.ddbActorFlags.name;
        }
      }
      return token;
    });

  const badTokens = tokens
    .filter((token) => !token.flags || !token.flags.ddbActorFlags || !token.flags.ddbActorFlags.id)
    .map((token) => {
      return token.name;
    });

  if (badTokens.length > 0) {
    console.error("********************");
    console.error("********************");
    console.error(`Book: ${bookCode} Scene: ${inData.name}`);
    console.error("BAD TOKENS");
    console.error(badTokens);
    console.error("********************");
    console.error("********************");
    console.error("********************");
  }

  if (!_.isEqual(finalTokens, tokens)) {
    console.log("Indata update from token mismatch");
    inDataUpdate = true;
  }

  if (inData.navName == "") {
    console.log("Indata update from blank nav name");
    inDataUpdate = true;
    delete inData.navName;
  }

  if (inData.flags.ddb.versions) {
    delete inData.flags.ddb.versions;
  }

  console.log("********************");

  console.log("Flag check...");
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
        alternateIds: inData.flags.ddb.alternateIds,
        originalLink: inData.flags.ddb.originalLink,
        foundryVersion: inData.flags.ddb.foundryVersion ? inData.flags.ddb.foundryVersion :  "0.8.9",
      }
    };
    if (inData.flags.ddb.tiles) newFlags.ddb.tiles = inData.flags.ddb.tiles;
    newFlags["stairways"] = inData.flags["stairways"] ? inData.flags["stairways"] : {};
    newFlags["perfect-vision"] = inData.flags["perfect-vision"] && !Array.isArray(inData.flags["perfect-vision"]) ? inData.flags["perfect-vision"] : {};
    newFlags["dynamic-illumination"] = inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : {};
    newFlags["ddbimporter"] = inData.flags["ddbimporter"] ? inData.flags["ddbimporter"] : {};

    if (!_.isEqual(inData.flags, JSON.parse(JSON.stringify(newFlags)))) {
      console.log("Indata update from newflags");
      console.log("Old flags:");
      console.log(inData.flags);
      console.log("New flags:");
      console.log(newFlags);
      inDataUpdate = true;
    }
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
      stairways: inData.flags.stairways ? inData.flags.stairways : {},
      "perfect-vision": inData.flags["perfect-vision"] && !Array.isArray(inData.flags["perfect-vision"]) ? inData.flags["perfect-vision"] : {},
      "dynamic-illumination": inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : {},
      ddbimporter: inData.flags["ddbimporter"] ? inData.flags["ddbimporter"] : {},
    };
    console.log("Indata update from missing ddb flags");
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
      stairways: inData.flags.stairways ? inData.flags.stairways : {},
      "perfect-vision": inData.flags["perfect-vision"] && !Array.isArray(inData.flags["perfect-vision"]) ? inData.flags["perfect-vision"] : {},
      "dynamic-illumination": inData.flags["dynamic-illumination"] ? inData.flags["dynamic-illumination"] : {},
      ddbimporter: inData.flags["ddbimporter"] ? inData.flags["ddbimporter"] : {},
    };
    console.log("Indata update from missing bookcode flag");
    inDataUpdate = true;
  }

  // tokens exist in the flags and are regenerated later
  delete inData.tokens;

  if (inData.flags && inData.flags.ddb && inData.flags.ddb.contentChunkId && !inData.flags.ddb.contentChunkId.startsWith("ddb-missing") && inData.name !== lookup.name) {
    inData.name = lookup.name;
    console.log("Indata update from missing scene");
    inDataUpdate = true;
  }

  console.log("********************");
  console.log("Lookup data:");
  console.log(lookup);
  // console.log(scenesData)
  let sceneData = (lookup.contentChunkId) 
    ? scenesData.find((scene) =>
      scene.flags.ddb && scene.flags.ddb.contentChunkId
      && lookup.contentChunkId.trim() == scene.flags.ddb.contentChunkId.trim()
      && lookup.ddbId === scene.flags.ddb.ddbId
      && lookup.parentId === scene.flags.ddb.parentId
      && lookup.cobaltId === scene.flags.ddb.cobaltId
    )
    : scenesData.find((scene) => lookup.name.toLowerCase().trim().replace("’", "").replace("'","").includes(scene.name.toLowerCase().trim().replace("’", "").replace("'","")));

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
    if (sceneData.flags.ddb) {
      if (sceneData.flags.ddb.notes) console.log(`Notes: ${sceneData.flags.ddb.notes.length}`);
      if (sceneData.flags.ddb.tokens) console.log(`Tokens: ${sceneData.flags.ddb.tokens.length}`);
      if (sceneData.flags.ddb.versions) {
        inData.flags.ddb.versions = sceneData.flags.ddb.versions;
        if(!inData.flags.ddb.versions.foundry) {
          inData.flags.ddb.versions.foundry = inData.flags.ddb.foundryVersion ? inData.flags.ddb.foundryVersion :  "0.8.9";
        }
      }
    }
  }
  else {
    console.log("Existing scene data not found");
  }
  console.log("********************");
  console.log("Import Data:");
  console.log(`Name: ${inData.name}`);
  console.log(`Walls: ${inData.walls.length}`);
  console.log(`Lights: ${inData.lights.length}`);
  if (inData.drawings) console.log(`Drawings: ${inData.drawings.length}`);
  if (inData.flags.ddb.notes) console.log(`Notes: ${inData.flags.ddb.notes.length}`);
  if (inData.flags.ddb.tokens) console.log(`Tokens: ${inData.flags.ddb.tokens.length}`);

  // get metadata updates
  const metaDataKey = `${bookCode}-${inData.flags.ddb.contentChunkId}`;
  const sceneUpdateDiff = ddbMetaData.scenes[metaDataKey]
    ? ddbMetaData.scenes[metaDataKey]
    : {
      name: inData.name,
      bookCode: bookCode,
      contentChunkId: inData.flags.ddb.contentChunkId,
      lastUpdate: ddbMetaDataVersion,
      notes: ddbMetaDataVersion,
      tokens: ddbMetaDataVersion,
      walls: ddbMetaDataVersion,
      lights: ddbMetaDataVersion,
      drawings: ddbMetaDataVersion,
      foundry: inData.flags.ddb.foundryVersion ? inData.flags.ddb.foundryVersion :  "0.8.9",
    };

  inData = _(inData).toPairs().sortBy(0).fromPairs().value();
  sceneData = _(sceneData).toPairs().sortBy(0).fromPairs().value();

  if (sceneData && inData.flags?.ddb?.foundryVersion && sceneData.flags?.ddb?.foundryVersion && !_.isEqual(inData.flags.ddb.foundryVersion, sceneData.flags.ddb.foundryVersion)) sceneUpdateDiff.foundry = inData.flags.ddb.foundryVersion;
  if (sceneData && !_.isEqual(inData.walls, sceneData.walls)) sceneUpdateDiff.walls = ddbMetaDataVersion;
  if (sceneData && !_.isEqual(inData.lights, sceneData.lights)) sceneUpdateDiff.lights = ddbMetaDataVersion;
  if (sceneData && inData.drawings && (!sceneData.drawings || !_.isEqual(inData.drawings, sceneData.drawings))) sceneUpdateDiff.drawings = ddbMetaDataVersion;
  if (sceneData && inData.flags.ddb.notes && sceneData.flags && (!sceneData.flags.ddb.notes || !_.isEqual(inData.flags.ddb.notes, sceneData.flags.ddb.notes))) sceneUpdateDiff.notes = ddbMetaDataVersion;
  if (sceneData && inData.flags.ddb.tokens && sceneData.flags && (!sceneData.flags.ddb.tokens || !_.isEqual(inData.flags.ddb.tokens, sceneData.flags.ddb.tokens))) sceneUpdateDiff.tokens = ddbMetaDataVersion;
  if (sceneUpdateDiff.flags) delete sceneUpdateDiff.flags;

  // final diff
  console.log("********************");

  const dataMatch = _.isEqual(JSON.parse(JSON.stringify(inData)), JSON.parse(JSON.stringify(sceneData)));
  const sceneDataFlags = sceneData.flags && sceneData.flags.ddb.versions;
  if (!sceneDataFlags) console.log("Updating to add scene data version flag");
  const versionFlags = inData.flags.ddb.versions;
  console.log("Data match: " + dataMatch);


  const sceneDataHints = adventure.loadImageFinderResults("scene", bookCode);
  const oldSceneDataHints = adventure.loadImageFinderResults("old-scene", bookCode);
  
  const inSceneDataHints = sceneDataHints ? sceneDataHints.some((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId) : [];
  const inOldSceneDataHints = oldSceneDataHints ? oldSceneDataHints.some((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId) : [];

  let alternativeSceneIdsUpdate = false;
  if (!inSceneDataHints && inOldSceneDataHints) {
    console.log("Scene data hint triggered indata update");
    inDataUpdate = true;
    alternativeSceneIdsUpdate = true;
    const oldData = oldSceneDataHints.find((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId);
    const alternateId = sceneDataHints.find((scene) => scene.img === oldData.img);
    console.log(alternateId);
    if (inData.flags.ddb.alternateIds) {
      if (!inData.flags.ddb.alternateIds.some((ai) => ai.contentChunkId === alternateId.contentChunkId)) {
        inData.flags.ddb.alternateIds.push(alternateId);
      }
    } else {
      inData.flags.ddb.alternateIds = [alternateId];
    }
  }

  if (!dataMatch || !versionFlags) {
    inData.flags.ddb.versions = {
      ddbMetaData: sceneUpdateDiff,
    };
  }

  if (inDataUpdate) {
    console.log("UPDATING INDATA!");
    FileHelper.saveJSONFile(inData, configFile);
  }

  if (!dataMatch || !sceneDataFlags || alternativeSceneIdsUpdate) {
    console.log("UPDATING META DATA");
    saveIndividualScenes([inData], conf);
    sceneUpdateDiff.lastUpdate = ddbMetaDataVersion;
    console.log("********************");
    console.log("MetaData Update:");
    console.log(sceneUpdateDiff);
    console.log("********************");
    updateDDBMetaData(conf, metaDataKey, sceneUpdateDiff);
  }

}


function actorCheck(config) {
  let missingActors = [];
  const adventure = new Adventure(config);
  adventure.loadSceneAdjustments();
  const scenesData = adventure.enhancements.sceneAdjustments;

  scenesData.forEach((scene) => {
    if (scene.flags.ddb.tokens) {
      scene.flags.ddb.tokens
        .filter((token) => token.flags.ddbActorFlags && token.flags.ddbActorFlags.id)
        .filter((token) => !config.lookups["monsters"].some((e) => e.id == token.flags.ddbActorFlags.id))
        .forEach((token) => {
          const result = {
            tokenName: token.name,
            id: token.flags.ddbActorFlags.id,
            actorName: token.flags.ddbActorFlags.name,
          };
          if(!missingActors.some((actor) => actor.id == token.flags.ddbActorFlags.id)) missingActors.push(result);
        });
    }
  });

  if (missingActors.length > 0) {
    console.log("Missing Actors for this adventure");
    console.log(missingActors);
  }

  return missingActors;
}

function sceneCheck(sceneFile) {
  
  const configFile = path.resolve(__dirname, sceneFile);
  let inData = FileHelper.loadJSONFile(configFile);
  const bookCode = (inData.flags.ddb && inData.flags.ddb.bookCode)
    ? inData.flags.ddb.bookCode
    : (inData.flags.vtta && inData.flags.vtta.code)
      ? inData.flags.vtta.code : undefined;

  const config = new Config();
  config.loadBook(bookCode);
  const adventure = new Adventure(config);

  const sceneData = adventure.getImageFinderResults("scene");
  const oldSceneData = adventure.getImageFinderResults("old-scene");
  
  const inSceneData = sceneData.some((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId);
  const inOldSceneData = oldSceneData.some((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId);

  if (!inSceneData && inOldSceneData) {
    const oldData = oldSceneData.find((scene) => scene.contentChunkId === inData.flags.ddb.contentChunkId);
    const alternateId = sceneData.find((scene) => scene.img === oldData.img);
    console.log(alternateId);
    if (inData.flags.ddb.alternateIds) {
      if (!inData.flags.ddb.alternateIds.some((ai) => ai.contentChunkId === alternateId.contentChunkId)) {
        inData.flags.ddb.alternateIds.push(alternateId);
      }
    } else {
      inData.flags.ddb.alternateIds = [alternateId];
    }
  }

  FileHelper.saveJSONFile(inData, configFile);
  saveIndividualScenes([inData], config);

  // "alternateIds": [{"contentChunkId": null}],

}

exports.importScene = importScene;
exports.listSceneIds = listSceneIds;
exports.actorCheck = actorCheck;
exports.sceneCheck = sceneCheck;
