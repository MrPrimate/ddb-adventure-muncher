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

    if (fs.existsSync(sceneDataPath)){
        scenesData = utils.loadJSONFile(sceneDataPath);
    }

    utils.saveJSONFile(adjustments, sceneDataPath);
}

function listSceneIds(bookCode, lookups=false) {
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
    let config = conf;
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
      r.contentChunkId === inData.flags.ddb.contentChunkId
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
    console.log("Lookup:");
    console.log(lookup);
    // console.log(scenesData)
    let sceneData = (lookup.contentChunkId) ? 
        scenesData.find((scene) => scene.flags.ddb && lookup.contentChunkId.trim() == scene.flags.ddb.contentChunkId.trim()) :
        scenesData.find((scene) => lookup.name.toLowerCase().trim().replace("’", "").replace("'","").includes(scene.name.toLowerCase().trim().replace("’", "").replace("'","")));

    // if (!sceneData && lookup.contentChunkId) {
    //   sceneData = scenesData.find((scene) => lookup.name.toLowerCase().trim().replace("’", "").replace("'","").includes(scene.name.toLowerCase().trim().replace("’", "").replace("'","")));
    // }

    console.log("********************");
    console.log("Scene Data:");
    if (sceneData) {
        console.log(sceneData.name);
        console.log(sceneData.flags); 
    }
    else {
        console.log("Existing scene data not found");
    }
  
    // remove things we can't deal with right now
    delete(inData.tokens);
    delete(inData.descriptions);

    if (inData.flags.ddb) {
        const newFlags = {
            ddb: {
                ddbId: inData.flags.ddb.ddbId,
                cobaltId: inData.flags.ddb.cobaltId,
                contentChunkId: inData.flags.ddb.contentChunkId,
                notes: inData.flags.ddb.notes,
            }
        };
  
        delete(inData.flags);
        inData.flags = newFlags;
    } else {
        delete(inData.flags);
    }
  

    inData.name = lookup.name;
    if (inData.navName == "") delete((inData.navName));

    // console.log(sceneData);
    //exit();
    if (sceneData) {
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
