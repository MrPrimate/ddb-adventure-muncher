"use strict";

const utils = require("./utils.js");
const { getAllSQL } = require("./sql.js");
const fs = require("fs");
const path = require("path");
const { exit } = require("process");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("@journeyapps/sqlcipher").verbose();
const _ = require("lodash");
const configure = require("./config.js");
const sceneAdjuster = require("./scene-load.js");
const noteHinter = require("./note-load.js");
const enhance = require("./enhance.js");
const parseTable = require("./vendor/parseTable.js");
const replacer = require("./replacer.js");

var journalSort = 1000;
var folderSort = 4000;
var config;
var idTable;
var sceneAdjustments;
var noteHints;
var sceneImgMatched = [];
var journalImgMatched = [];
var enhancedScenes = [];
var downloadList = [];
var tableMatched = [];

let replaceLinks = [];
let tempHandouts = {};

var masterFolder;

let generatedJournals = [];
let generatedFolders = [];
let generatedScenes = [];
let generatedTables = [];

var templateDir = path.join("..", "content", "templates");

let imageFinderSceneResults = [];
let imageFinderJournalResults = [];

function setTemplateDir (dir) {
  templateDir = dir;
}

function fetchLookups (config) {
  idTable = configure.getLookups();
  if (!idTable[config.run.bookCode]) idTable[config.run.bookCode] = [];
}


function getId(document, docType) {
  const contentChunkId =  (document.flags.ddb.contentChunkId && document.flags.ddb.contentChunkId != "") ? 
    document.flags.ddb.contentChunkId :
    null;

  const existingId = idTable[config.run.bookCode].find((r) => {
    const basicCheck = r.type == document.type &&
      r.docType == docType &&
      r.ddbId == document.flags.ddb.ddbId &&
      r.cobaltId === document.flags.ddb.cobaltId &&
      r.parentId === document.flags.ddb.parentId;
    const chunkCheck = (contentChunkId) ? 
      contentChunkId == r.contentChunkId :
      true;
    const sceneNotes = (document.flags.ddb.note) ? 
      document.name === r.name:
      true;

    return basicCheck && chunkCheck && sceneNotes;
  });

  // console.log(`Finding id for ${docType} ${document.name}`);
  // console.log(`Note? ${document.flags.ddb.note}`);
  // if (existingId) console.log(`For ${docType} ${document.name} returning id ${existingId.id} with name ${existingId.name}`)
  // console.log("------------------")
  
  if (existingId) {
    return existingId.id;
  } else {
    const id = {
      id: `${utils.randomString(16,"#aA")}`,
      type: document.type,
      docType: docType,
      ddbId: document.flags.ddb.ddbId,
      cobaltId: document.flags.ddb.cobaltId,
      parentId: document.flags.ddb.parentId,
      contentChunkId: contentChunkId,
      name: document.name,
    };
    idTable[config.run.bookCode].push(id);
    return id.id;
  }
}



function findDiceColumns(table) {
  let result = [];
  if (table.tHead) {
    const headings = parseTable.getHeadings(table);
    headings.forEach((h) => {
      const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*)?)/, "g");
      const match = h.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").match(diceRegex);
      if (match) {
        result.push(h);
      }
    });
  }
  return result;
}

function guessTableName(document, contentChunkId) {
  const element = document.querySelector(`table[data-content-chunk-id='${contentChunkId}']`);
  let sibling = element.previousElementSibling;
  
  if (!sibling && element.parentElement.nodeName === "DIV") {
    sibling = element.parentElement.previousElementSibling;
  }

  if (sibling) {
    console.log(sibling.textContent);
    return sibling.textContent;
  } else {
    console.log(`No table name identified for ${contentChunkId}`);
    return null;
  }
}

function fixUpTables(tables, journals) {
  //for each table
  console.log("Updating table references");
  tables.forEach((table) => {
    table.results.forEach((result) => {
      result.text = replacer.moduleReplaceLinks(result.text, journals, config);
      result.text = replacer.foundryCompendiumReplace(result.text, config);
      result.text = replacer.replaceRollLinks(result.text);
      result.text = JSDOM.fragment(result.text).textContent;
    });
  });

  console.log("Updating journals with table links");

  journals.forEach((journal) => {
    console.log(`Journal: ${journal.name}`);
    if (!journal.content) return;
    const dom = new JSDOM(journal.content).window.document;
    tables.forEach((table) => {
      const tablePoint = dom.body.querySelector(`table[data-content-chunk-id="${table.flags.ddb.contentChunkId}"]`);
      if (tablePoint) {
        console.log(`Updating table reference for: ${table.name}`);
        tablePoint.insertAdjacentHTML("afterend", `<div id="table-link">@RollTable[${table.name}]{Open RollTable}</div>`);
      }
    });
    journal.content = dom.body.innerHTML;
  });
  
  return [tables, journals];
}

function diceInt(text) {
  if (text === "0") return 10;
  if (text === "00") return 100;
  return parseInt(text);
}

/**
 * This could be:
 * a single value e.g. 19
 * a range of values 19-20
 * remaining values 19+
 * @param {*} value 
 * @returns array of range 
 */
function getDiceTableRange(value) {
  const text = value.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(/\s/g, "").trim();
  // eslint-disable-next-line no-useless-escape
  const valueRegex = new RegExp(/^(\d+)\-(\d+)|^(\d+)(\+?)$/);
  const valueMatch = text.match(valueRegex);


  if (valueMatch) {
    if (valueMatch[1] !== undefined && valueMatch[2] !== undefined) {
      const low = diceInt(valueMatch[1]);
      const high = diceInt(valueMatch[2]);
      return [low, high];
    }

    if (valueMatch[3]) {
      if (valueMatch[4] !== undefined && valueMatch[4] === "+") {
        const low = diceInt(valueMatch[3]);
        return [low, 0];
      }
      if (valueMatch[4] !== undefined && valueMatch[4] === "") {
        const low = diceInt(valueMatch[3]);
        return [low, low];
      }
    }
  }
  console.error("###############################################");
  console.log(`Unable to table range match ${value}`);
  console.error("###############################################");
  return [];
}


function buildTable(row, parsedTable, keys, diceKeys, tableName, contentChunkId) {
  let tmpCount = 1;
  diceKeys.forEach((diceKey) => {
    const table = JSON.parse(JSON.stringify(require(path.join(templateDir,"table.json"))));
    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";

    table.name = tableName + nameExtension;
    table.flags.ddb.ddbId = row.id;
    table.flags.ddb.bookCode = config.run.bookCode;
    table.flags.ddb.slug = row.slug;
    table.flags.ddb.contentChunkId = contentChunkId;
    table.flags.ddb.userData = config.run.userData;
    table.sort = journalSort + parseInt(row.id);
    if (row.cobaltId) table.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) table.flags.ddb.parentId = row.parentId;

    const tableRow = {
      title: table.name,
      id: 10000 + table.flags.ddb.ddbId + tmpCount,
      cobaltId: (table.flags.ddb.cobaltId) ? table.flags.ddb.cobaltId : table.flags.ddb.parentId,
      documentName: table.name,
      contentChunkId: contentChunkId,
    };

    table.folder = getFolderId(tableRow, "RollTable");
    table._id = getId(table, "RollTable");

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);
    //console.log(formulaMatch);
    table.formula = formulaMatch ? formulaMatch[0].trim() : "";

    table.results = [];
    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry. 
    // if more than one result key then we will concat the results.

    console.log("*******************************************");
    console.log(`Generating table ${table.name}`);
    if (config.debug) console.log(row);
    // console.log(parsedTable.length);

    parsedTable.forEach((entry) => {
      const result = {
        _id: `${utils.randomString(16,"#aA")}`,
        flags: {},
        type: 0,
        text: "",
        img: "icons/svg/d20-black.svg",
        resultId: "",
        weight: 1,
        range: [],
        drawn: false
      };
      Object.entries(entry).forEach(([key, value]) => {
        if (key === diceKey) result.range = getDiceTableRange(value);
        else if (diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.text != "") result.text += "\n\n";
          result.text += `<b>${key}</b>${value}`;
        } else {
          result.text = value;
        }
      });
      table.results.push(result);
    });

    console.log(`Generated table entry ${table.name}`);
    generatedTables.push(table);
    tmpCount++;

  });
}

function generateTable(row, journal, html) {

  const document = new JSDOM(html).window.document;
  const tableNodes = document.querySelectorAll("table");

  tableNodes.forEach(node => {
    const parsedTable = parseTable.parseTable(node);
    const keys = parseTable.getHeadings(node);
    const diceKeys = findDiceColumns(node);
    const contentChunkId = node.getAttribute("data-content-chunk-id");
    const nameGuess = guessTableName(document, contentChunkId);

    console.log("***********************************************");
    console.log("Table detection!");
    console.log(`Table: "${nameGuess}"`);
    console.log(`ContentChunkId: ${contentChunkId}`);
    console.log(`Dice Keys: ${diceKeys.join(", ")}`);
    console.log(`Keys: ${keys.join(", ")}`);
    console.log("***********************************************");
    if (config.debug) console.log(node.outerHTML);
    if (config.debug && parsedTable) console.log(parsedTable);
    // if (parsedTable) console.log(parsedTable);
    console.log("***********************************************");
    
    buildTable(row, parsedTable, keys, diceKeys, nameGuess, contentChunkId);
    tableMatched.push({
      // foundryId: ,
      nameGuess: nameGuess,
      length: parsedTable.length,
      keys: keys,
      diceKeys: diceKeys,
      diceTable: diceKeys.length > 0,
      multiDiceKeys: diceKeys.length > 1,
      diceKeysNumber: diceKeys.length,
      totalKeys: keys.length,
      journal: journal.name,
      id: node.id,
      class: node.class,
      contentChunkId: contentChunkId,
    });
  });

}

function updateJournals(documents) {
  // console.log(replaceLinks);
  documents = documents.map((doc) => {
    console.log("***********************");
    console.log(`Updating: ${doc.name}`);
    if (doc.content) {
      doc.content = doc.content.replace(/\s+/g, " ");
      // console.log(doc.content);
      console.log("---------------");
      console.log(`Replacing generate link content for ${doc.name}`);
      replaceLinks.forEach((link) => {
        // console.log(link);
        // console.log(doc.content.includes(link.html));
        doc.content = doc.content.replace(link.html, link.ref);
      });
      console.log(`Replacing image links for ${doc.name}`);
      doc.content = replacer.replaceImageLinks(doc.content, config);
      console.log(`Linking module content for ${doc.name}`);
      doc.content = replacer.moduleReplaceLinks(doc.content, documents, config);
      console.log(`Linking ddb-importer compendium content for ${doc.name}`);
      doc.content = replacer.foundryCompendiumReplace(doc.content, config);
      console.log(`Generating dice rolls for ${doc.name}`);
      doc.content = replacer.replaceRollLinks(doc.content);
    }
    return doc;
  });

  return documents;
}

function generateFolder(type, row, baseFolder=false, img=false, note=false) {
  const folder = JSON.parse(JSON.stringify(require(path.join(templateDir,"folder.json"))));
  folder.flags.ddb.ddbId = (row.ddbId) ? row.ddbId : row.id;
  folder.flags.ddb.img = img;
  folder.flags.ddb.note = note;
  folder.name = row.title;
  folder.type = type;
  folder.sort = folderSort + parseInt(row.id);
  if (row.cobaltId && !baseFolder) {
    folder.parent = masterFolder[type]._id;
  }
  if (note) {
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    folder.name = `[Pins] ${row.sceneName ? row.sceneName : parent.name}`;
    folder.sort = 900000;
    folder.parent = `${parent._id}`;
    folder.flags.ddb.parentId = parentId;
  }
  else if (img) {
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    folder.name = `[Handouts] ${row.sceneName ? row.sceneName : parent.name}`;
    folder.sort = 1000000;
    folder.parent = `${parent._id}`;
    folder.flags.ddb.parentId = parentId;
  } else if (row.parentId) {
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && !f.flags.ddb.img);
    if (parent) {
      folder.parent = `${parent._id}`;
      folder.name = `[Sections] ${parent.name}`;
    }
    folder.flags.ddb.parentId = row.parentId;
  } else if(!baseFolder) {
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == -1 && f.type == type && !f.flags.ddb.img);
    if (parent) folder.parent = `${parent._id}`;
  }
  if (row.cobaltId) folder.flags.ddb.cobaltId = row.cobaltId;

  folder._id = getId(folder, "Folder");
  folder.flags.importid = folder._id;
  generatedFolders.push(folder);
  if (type === "JournalEntry" && !baseFolder && !img && !note) {
    // lets generate a Scene Folder at the same time
    // we do this so the scene folder order matches the same as the journals as some
    // adventures e.g. CoS have different kind of scene detection
    getFolderId(row, "Scene");
    getFolderId(row, "RollTable");
  }
  return folder;
}



function getFolderId(row, type, img, note) {
  let folderId;
  let folder;

  if (note) {
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    folder = generatedFolders.find((f) => f.flags.ddb.ddbId == row.ddbId && f.flags.ddb.parentId == parentId && f.type == type && !f.flags.ddb.img && f.flags.ddb.note == note && f.name.includes(row.sceneName));
    if (!folder) folder = generateFolder(type, row, false, img, note);
    folderId = folder._id;
  } else if (img) {
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    folder = generatedFolders.find((f) => f.flags.ddb.parentId == parentId && f.type == type && f.flags.ddb.img == img);
    if (!folder) folder = generateFolder(type, row, false, img, note);
    folderId = folder._id;
  } else if (row.cobaltId) {
    folder = generatedFolders.find((f) => f.flags.ddb.cobaltId == row.cobaltId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    if (!folder) folder = generateFolder(type, row, false, img, note);
    folderId = folder._id;
    // return masterFolder[type]._id;
  } else if (row.parentId) {
    folder = generatedFolders.find((f) => f.flags.ddb.parentId == row.parentId && f.type == type && f.flags.ddb.img == img && f.flags.ddb.note == note);
    if (!folder) folder = generateFolder(type, row, false, img, note);
    folderId = folder._id;
  } else {
    folder = generatedFolders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && f.flags.ddb.img == img && f.flags.ddb.note == note);
    if (folder) folderId = folder._id;
  }
  return folderId;
}

function appendJournalToChapter(row) {
  if (row.parentId) {
    console.log(`${row.title} ${row.parentId} search...`);
    generatedJournals.forEach((journal) => {
      if (journal.flags.ddb.cobaltId == row.parentId) {
        journal.content += row.html;
      }
    });
  }
}

function generateJournalEntry(row, img=null, note=false) {
  let journal = JSON.parse(JSON.stringify(require(path.join(templateDir,"journal.json"))));

  journal.name = row.title;
  journal.flags.ddb.ddbId = row.id;
  journal.flags.ddb.bookCode = config.run.bookCode;
  journal.flags.ddb.slug = row.slug;
  const contentChunkId =  (row.contentChunkId && row.contentChunkId != "") ? 
    row.contentChunkId :
    null;
  journal.flags.ddb.contentChunkId = contentChunkId;
  journal.flags.ddb.userData = config.run.userData;
  journal.sort = journalSort + parseInt(row.id);
  if (row.cobaltId) journal.flags.ddb.cobaltId = row.cobaltId;
  let imgState = (img !== null && img !== "") ? true : false;
  if (imgState) {
    journal.img = replacer.replaceImgLinksForJournal(img, config);
    if (journalImgMatched.includes(journal.img)) {
      const journalMatch = generatedJournals.find((j) => j.img === journal.img);
      journal.flags.ddb.duplicate = true;
      journal.flags.ddb.duplicateId = journalMatch._id;
      journal.flags.ddb.linkName = journalMatch.name;
    } else {
      journal.flags.ddb.duplicate = false;
      journal.flags.ddb.linkName = journal.name;
      if (config.imageFind) {
        imageFinderJournalResults.push({
          bookCode: config.run.bookCode,
          img: journal.img,
          name: journal.name,
          slug: row.slug,
        });
      }
    }
    journalImgMatched.push(journal.img);
    const journalHandoutCount = journalImgMatched.filter(img => img === journal.img).length;
    console.log(`Generated Handout ${journal.name}, "${journal.img}", (count ${journalHandoutCount}), Duplicate? ${journal.flags.ddb.duplicate}`);
  } else {
    const dom = new JSDOM(row.html);
    journal.content = dom.window.document.body.innerHTML.replace(/\s+/g, " ");
    if (!note) generateTable(row, journal, journal.content);
  }
  if (row.parentId) journal.flags.ddb.parentId = row.parentId;
  if (!row.ddbId) row.ddbId = row.id;
  journal.folder = getFolderId(row, "JournalEntry", imgState, note);
  // console.log(row);
  // console.log(journal);
  // console.log(`${journal.name}, ${journal.folder}`);
  journal._id = getId(journal, "JournalEntry");
  console.log(`Generated journal entry ${journal.name}`);
  if (!imgState && !note) {
    appendJournalToChapter(row);
  }
  if (!journal.flags.ddb.duplicate) {
    console.log(`Appending ${journal.name} "${journal.img}"`);
    generatedJournals.push(journal);
  }
  return journal;
}

/**
 * For now this function generates Note Journal entries only
 * @param {*} row 
 * @param {*} text 
 * @returns 
 */
function generateNoteJournals(row) {

  let notes = [];

  // noteHints needs:
  // id
  // cobaltId
  // parentId
  // tag to split at
  // contentChunkId to start at
  // contentChunkId to stop at

  // test hint, LMOP
  // noteHints = [{
  //   ddbId: 9,
  //   cobaltId: null,
  //   parentId: 394,
  //   splitTag: "h3",
  //   slug: "goblin-arrows#CragmawHideout",
  //   tagIdFirst: "1CaveMouth",
  //   contentChunkIdStart: "6090f5fa-5c2b-43d4-89c0-1b5e37a9b9c5",
  //   tagIdLast: "WhatsNext",
  //   contentChunkIdStop: "3672ecdc-d709-40b5-bb0f-c06c70c1aa15",
  //   sceneName: "Cragmaw Hideout",
  // }]
  if (!noteHints && noteHints.length == 0) return notes;

  const dom = new JSDOM(row.html).window.document;
  // dom.body.innerHTML.replace(/  /g, " ");
  let tmpCount = 0;

  noteHints.filter((hint) => hint.slug == row.slug).forEach((hint) => {
    let id = 2000 + row.id;
    console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
    console.log(`Generating Notes for ${hint.slug} ContentChunkId ${hint.contentChunkIdStart}`);
    
    let keyChunk = dom.querySelector(`${hint.splitTag}[data-content-chunk-id='${hint.contentChunkIdStart}']`);
    let html = "";
    let noteTitle = keyChunk.textContent;
    let keyChunkId = hint.contentChunkIdStart;
    let idTagStop = hint.contentChunkIdStop === "IDSTOP";

    while (true) {
      tmpCount++;
      keyChunk = keyChunk.nextElementSibling;

      const chunkId = keyChunk ? keyChunk.getAttribute("data-content-chunk-id") : undefined;
      const tagMatch = keyChunk ? keyChunk.tagName.toUpperCase() === hint.splitTag.toUpperCase() : false;
      const idStop = idTagStop && keyChunk.getAttribute("id") === hint.tagIdLast;
      const stopChunk = keyChunk === null || chunkId === hint.contentChunkIdStop || idStop;

      // if we have reached the same tag type or last chunk generate a journal
      if (tagMatch || stopChunk) {
        let noteRow = JSON.parse(JSON.stringify(row));
        noteRow.html = html;
        noteRow.title = noteTitle;
        noteRow.contentChunkId = keyChunkId;
        noteRow.sceneName = hint.sceneName;
        noteRow.id  = id + tmpCount;
        noteRow.ddbId = row.id;
        notes.push(generateJournalEntry(noteRow, null, true));
        html = "";
      }

      // if we have reached the end leave
      if (stopChunk) {
        break;
      } else if (tagMatch) {
        noteTitle = keyChunk.textContent;
        keyChunkId = chunkId;
      } else {
        // we add the chunk contents to the html block
        html += keyChunk.outerHTML;
      }

    }

    console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
  });

  return notes;
}

function generateScene(row, img) {
  let scene = JSON.parse(JSON.stringify(require(path.join(templateDir,"scene.json"))));

  scene.name = row.sceneName;
  scene.navName = row.sceneName.split(":").pop().trim();

  const journalMatch = generatedJournals.find((journal) => 
    journal.name.includes(scene.navName) &&
    !journal.flags.ddb.notes && !journal.flags.ddb.img && !journal.img
  );
  if (journalMatch) scene.journal = journalMatch._id;

  scene.img = img;
  scene.flags.ddb.documentName = row.documentName;
  scene.flags.ddb.ddbId = row.id;
  scene.flags.ddb.bookCode = config.run.bookCode;
  scene.flags.ddb.slug = row.slug;
  // console.log("#############################");
  // console.log(row);
  // console.log("#############################");
  const contentChunkId =  (row.contentChunkId && row.contentChunkId != "") ? 
    row.contentChunkId :
    null;
  scene.flags.ddb.contentChunkId = contentChunkId;
  scene.flags.ddb.userData = config.run.userData;
  scene.sort = journalSort + parseInt(row.id);
  if (row.cobaltId) scene.flags.ddb.cobaltId = row.cobaltId;
  if (row.parentId) {
    row.cobaltId = row.parentId;
    scene.flags.ddb.parentId = row.parentId;
    delete(row.parentId);
  }
  row.title = row.documentName;
  scene.folder = getFolderId(row, "Scene");

  const imagePath = path.join(config.run.outputDir,img);
  const dimensions = utils.imageSize(imagePath);
  // console.log(dimensions.width, dimensions.height);
  scene.width = dimensions.width;
  scene.height = dimensions.height;
  // console.log(row);
  // console.log(journal);
  // console.log(`${journal.name}, ${journal.folder}`);

  let adjustment = (scene.flags.ddb.contentChunkId) ?
    sceneAdjustments.find((s) => scene.flags.ddb.contentChunkId === s.flags.ddb.contentChunkId) :
    sceneAdjustments.find((s) => scene.name.includes(s.name));

  if (adjustment) {
    if (adjustment.flags.ddb.notes) {
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.log("Found notes!!!!!");

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      adjustment.notes = [];

      adjustment.flags.ddb.notes.forEach((note) => {
        const noteJournal = generatedJournals.find((journal) =>
        // journal.flags.ddb.slug == note.flags.slug &&
        // journal.flags.ddb.ddbId == note.flags.ddbId &&
        // journal.flags.ddb.parentId == note.flags.parentId &&
        // journal.flags.ddb.cobaltId == note.flags.cobaltId &&
          journal.flags.ddb.contentChunkId == note.flags.contentChunkId
        );
        if (noteJournal){
          let prefix = note.label.trim().split(".")[0].split(" ")[0];
          // some notes start with letter e.g. S1.
          // if there is no number match then we will attempt to regex it out
          if (isNaN(parseInt(prefix))) {
            const numMatch = prefix.match(/\d+/);
            if (numMatch) {
              prefix = numMatch[0];
            }
          }

          const icon = (isNaN(parseInt(prefix))) ?
            prefix.length == 1 ?
              "modules/ddb-importer/icons/" + prefix.toUpperCase() + ".svg" :
              "icons/svg/book.svg" :
            "modules/ddb-importer/icons/" + prefix.padStart(2, "0") + ".svg";

          note.positions.forEach((position) => {
            const noteId = getId(noteJournal, "Note");
            const n = {
              "_id": noteId,
              "flags": {
                "ddb": note.flags,
                "importid": noteId,
              },
              "entryId": noteJournal._id,
              "x": position.x,
              "y": position.y,
              "icon": icon,
              "iconSize": 40,
              "iconTint": "",
              "text": "",
              "fontFamily": "Signika",
              "fontSize": 48,
              "textAnchor": 1,
              "textColor": ""
            };
            adjustment.notes.push(n);
          });
        }
      });
      // delete(adjustment.flags.ddb.notes);
    }
    scene = _.merge(scene, adjustment);
  }

  scene._id = getId(scene, "Scene");

  if (config.imageFind) {
    imageFinderSceneResults.push({
      bookCode: config.run.bookCode,
      img: scene.img,
      name: scene.name,
      slug: row.slug,
      contentChunkId: contentChunkId,
    });
  }

  const disableEnhancedDownloads = (config.disableEnhancedDownloads) ? 
    config.disableEnhancedDownloads :
    false;

  
  if (config.debug) console.log(`Scene name: "${scene.name}" Img: "${scene.img}"`);
  //const enhancedScene = enhancedScenes.find((es) => es.name === scene.name && es.img === scene.img);
  const enhancedScene = enhancedScenes.find((es) => es.img === scene.img && es.bookCode === config.run.bookCode);
  if (config.debug) console.log(enhancedScene);

  if (enhancedScene) {
    if (enhancedScene.hiresImg && !disableEnhancedDownloads) {
      downloadList.push({name: scene.name, url: enhancedScene.hiresImg, path: scene.img });
    }
    if (enhancedScene.adjustName != "") {
      scene.name = enhancedScene.adjustName;
      scene.navName = enhancedScene.adjustName;
    }
  }
  if (config.debug) console.log(`Scene name: "${scene.name}" Img: "${scene.img}"`);

  generatedScenes.push(scene);
  sceneImgMatched.push(scene.img);
  const sceneCount = sceneImgMatched.filter(img => img === scene.img).length;
  console.log(`Generated Scene "${scene.name}" with "${scene.img}", (count ${sceneCount})`);
  return scene;
}

function generateMissingScenes(journals, scenes) {
  let tmpCount = 0;

  enhancedScenes.filter((es) => es.missing).forEach((es) => {
    const id =  90000 + es.ddbId + tmpCount;
    const row = {
      title: `${es.name} (Player Version)`,
      id: id,
      slug: es.slug,
      parentId: es.parentId,
      cobaltId: es.cobaltId,
      documentName: es.name,
      sceneName: es.name,
      contentChunkId: `ddb-missing-${config.run.bookCode}-${id}`,
    };
    tmpCount++;
    const playerEntry = generateJournalEntry(row, es.img);
    journals.push(playerEntry);
    scenes.push(generateScene(row, es.img));
  });

  return [journals, scenes];
}

function findScenes(document) {
  let scenes = [];
  let journals = [];
  let linkReplaces = [];
  let tmpCount = 0;
  const handoutTmpRef = document.flags.ddb.cobaltId ? document.flags.ddb.cobaltId : document.flags.ddb.parentId;
  let unknownHandoutCount = tempHandouts[handoutTmpRef];
  if (unknownHandoutCount === null || unknownHandoutCount === undefined) unknownHandoutCount = 1;
  // const frag = JSDOM.fragment(document.content);
  const frag = new JSDOM(document.content);
  document.content = frag.window.document.body.innerHTML;

  console.log("----------------------------------------------");
  console.log(`Finding Scenes in ${document.name}`);

  // let possibleSceneNodes = frag.querySelectorAll("a[data-lightbox]");
  let possibleFigureSceneNodes = frag.window.document.body.querySelectorAll("figure");
  let possibleDivSceneNodes = frag.window.document.body.querySelectorAll("div.compendium-image-with-subtitle-center, div.compendium-image-with-subtitle-right, div.compendium-image-with-subtitle-left");
  let possibleHandouts = frag.window.document.body.querySelectorAll("img.ddb-lightbox-inner");
  let possibleViewPlayerScenes = frag.window.document.body.querySelectorAll("p.compendium-image-view-player");
  let possibleUnknownPlayerLinks = frag.window.document.body.querySelectorAll("a.ddb-lightbox-inner, a.ddb-lightbox-outer");

  // if (config.debug) {
  console.log(`possibleFigureSceneNodes ${possibleFigureSceneNodes.length}`);
  console.log(`possibleDivSceneNodes ${possibleDivSceneNodes.length}`);
  console.log(`possibleHandouts ${possibleHandouts.length}`);
  console.log(`possibleViewPlayerScenes ${possibleViewPlayerScenes.length}`);
  // }

  if (possibleFigureSceneNodes.length > 0) {
    possibleFigureSceneNodes.forEach((node) => {
      let caption = node.querySelector("figcaption");
      let img = node.querySelector("img");

      if (!img.src) return;
      tmpCount++;

      if (caption) {
        // console.log(document);
        let title = caption.textContent;
        const playerRef = node.querySelector("a[data-title~=Player]");
        if (playerRef) {
          title = utils.titleString(title.replace(playerRef.textContent, "").trim());

          let rowContentChunkId = caption.getAttribute("data-content-chunk-id");
          if (!rowContentChunkId) {
            // figure type embedds mostly don't have content chunk Id's 
            // we fall back to element ID which appears to be unique for the outer figure element
            rowContentChunkId = `${node.id}-player`;
          }

          let row = {
            title: `${title} (Player Version)`,
            id: 10000 + document.flags.ddb.ddbId + tmpCount,
            parentId: document.flags.ddb.parentId,
            cobaltId: document.flags.ddb.cobaltId,
            slug: document.flags.ddb.slug,
            documentName: document.name,
            sceneName: utils.titleString(title),
            contentChunkId: rowContentChunkId,
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          journals.push(playerEntry);
          linkReplaces.push( {html: playerRef.outerHTML, ref: `@JournalEntry[${title}]{DM Version} @JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version}` });
          document.content = document.content.replace(playerRef.outerHTML, `@JournalEntry[${title}]{DM Version} @JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version}`);
          scenes.push(generateScene(row, playerEntry.img));
        }

        let contentChunkId = node.getAttribute("data-content-chunk-id");
        if (!contentChunkId) {
          // figure type embedds mostly don't have content chunk Id's 
          // we fall back to element ID which appears to be unique for the outer figure element
          contentChunkId = node.id;
        }

        let row = {
          title: utils.titleString(title),
          id: 10000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: contentChunkId,
          slug: document.flags.ddb.slug,
        };
        const journalEntry = generateJournalEntry(row, img.src);
        journals.push(journalEntry);
      }
    });
  }

  if (possibleFigureSceneNodes.length == 0 && possibleDivSceneNodes.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleDivSceneNodes.forEach((node) => {
      let caption = node.querySelector("h3, h4");
      let img = node.querySelector("img");

      if (!img.src) return;
      tmpCount++;

      if (caption) {
        console.log(`Checking ${caption.textContent} for Scenes`);
        // console.log(document);
        let title = caption.textContent;
        let nextNode = frag.window.document.getElementById(node.id);
        let playerVersion = false;
        let lightBoxNode;

        for (let i = 0; i < 15; i++) {
          if (!nextNode) {
            lightBoxNode = Array.from(node.querySelectorAll("a.ddb-lightbox-outer"))
              .find(el => el.textContent.toLowerCase().includes("player"));
            // console.log(lightBoxNode.outerHTML)
            // console.log(`Attempting div query ${lightBoxNode}`)
          } else {
            nextNode = nextNode.nextSibling;
            if (!nextNode || !nextNode.tagName) continue;
            lightBoxNode = (nextNode.tagName == "P") ? nextNode.querySelector("a.ddb-lightbox-outer") : undefined;
          }
          if (lightBoxNode) {
            playerVersion = lightBoxNode.textContent.toLowerCase().includes("player");
            break;
          }
        }
        // console.log(lightBoxNode)
        // console.log(playerVersion);

        if (playerVersion) {
          //const playerRef = nextNode.querySelector("a.ddb-lightbox-outer");
          const playerRef = lightBoxNode;
          title = utils.titleString(title.replace(playerRef.textContent, "").trim());

          let row = {
            title: `${title} (Player Version)`,
            id: 11000 + document.flags.ddb.ddbId + tmpCount,
            parentId: document.flags.ddb.parentId,
            cobaltId: document.flags.ddb.cobaltId,
            slug: document.flags.ddb.slug,
            documentName: document.name,
            sceneName: utils.titleString(title),
            contentChunkId: (nextNode) ? nextNode.getAttribute("data-content-chunk-id") : undefined,
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          journals.push(playerEntry);
          linkReplaces.push( {html: playerRef.outerHTML, ref: `@JournalEntry[${title}]{DM Version} @JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version} [DDB]` });
          document.content = document.content.replace(playerRef.outerHTML, `@JournalEntry[${title}]{DM Version} @JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version} [DDB2]`);
          scenes.push(generateScene(row, playerEntry.img));
        } else {
          document.content = document.content.replace(img.outerHTML, `${img.outerHTML} @JournalEntry[${title}]{${title}}`);
        }

        let row = {
          title: title,
          id: 11000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: caption.getAttribute("data-content-chunk-id"),
          slug: document.flags.ddb.slug,
        };
        const journalEntry = generateJournalEntry(row, img.src);
        journals.push(journalEntry);
      }
    });
  }
  if (possibleFigureSceneNodes.length == 0 && possibleViewPlayerScenes.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleViewPlayerScenes.forEach((node) => {
      let aNode = node.querySelector("a.ddb-lightbox-outer");
      if (!aNode || aNode.length == 0) return; 

      tmpCount++;
      if (config.debug) {
        console.log(aNode.outerHTML);
      }

      let title = `${document.name} (Player Version)`;

      let row = {
        title: title,
        id: 13000 + document.flags.ddb.ddbId + tmpCount,
        parentId: document.flags.ddb.parentId,
        cobaltId: document.flags.ddb.cobaltId,
        documentName: document.name,
        sceneName: utils.titleString(document.name),
        contentChunkId: node.getAttribute("data-content-chunk-id"),
        slug: document.flags.ddb.slug,
      };
      const journalEntry = generateJournalEntry(row, aNode.href.replace("ddb://image", "."));
      
      // don't add entry if we have already parsed this
      // 
      if (!journalEntry.flags.ddb.duplicate) {
        linkReplaces.push( {html: aNode.outerHTML, ref: `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}` });
        document.content = document.content.replace(aNode.outerHTML, `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}`);
        journals.push(journalEntry);
      }
      if (!sceneImgMatched.includes(journalEntry.img)) {
        scenes.push(generateScene(row, journalEntry.img));
      }
    });
  }

  possibleUnknownPlayerLinks.forEach((node) => {
    if (sceneImgMatched.includes(node.href)) return;
    if (!node.textContent.toLowerCase().includes("player")) return;

    tmpCount++;
    if (config.debug) {
      console.log(node.outerHTML);
    }

    let title = `${document.name} (Player Version)`;

    let row = {
      title: title,
      id: 14000 + document.flags.ddb.ddbId + tmpCount,
      parentId: document.flags.ddb.parentId,
      cobaltId: document.flags.ddb.cobaltId,
      documentName: document.name,
      sceneName: utils.titleString(document.name),
      contentChunkId: node.parentElement.getAttribute("data-content-chunk-id"),
      slug: document.flags.ddb.slug,
    };
    const journalEntry = generateJournalEntry(row, node.href.replace("ddb://image", "."));

    // don't add entry if we have already parsed this
    if (!journalEntry.flags.ddb.duplicate) {
      linkReplaces.push( {html: node.outerHTML, ref: `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}` });
      document.content = document.content.replace(node.outerHTML, `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}`);
      journals.push(journalEntry);
    }
    if (!sceneImgMatched.includes(journalEntry.img)) {
      scenes.push(generateScene(row, journalEntry.img));
    }
  });

  if (possibleFigureSceneNodes.length == 0 && possibleHandouts.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleHandouts.forEach((node) => {
      if(!node.src) return;
      tmpCount++;
      if (config.debug) {
        console.log(node.outerHTML);
      }

      let title = `Handout ${unknownHandoutCount}`;

      let row = {
        title: title,
        id: 12000 + document.flags.ddb.ddbId + tmpCount,
        parentId: document.flags.ddb.parentId,
        cobaltId: document.flags.ddb.cobaltId,
        contentChunkId: node.getAttribute("data-content-chunk-id"),
        slug: document.flags.ddb.slug,
      };
      const journalEntry = generateJournalEntry(row, node.src);
      if (!journalEntry.flags.ddb.duplicate) {
        unknownHandoutCount++;
        linkReplaces.push( {html: node.parentNode.outerHTML, ref: `${node.parentNode.outerHTML} @JournalEntry[${journalEntry.flags.ddb.linkName}]{${title}}` });
        document.content = document.content.replace(node.parentNode.outerHTML, `${node.parentNode.outerHTML} @JournalEntry[${journalEntry.flags.ddb.linkName}]{${title}}`);
        journals.push(journalEntry);
      }
    });
  }

  tempHandouts[handoutTmpRef] = unknownHandoutCount;
  return [scenes, journals, linkReplaces];
}


function generateJournalChapterEntry(row, img=null) {
  const existingJournal = generatedJournals.find((f) => f.flags.ddb.ddbId == row.id);
  if (!existingJournal){
    const journal = generateJournalEntry(row, img);
    return journal;
  }
  return undefined;
}

function outputAdventure(config) {
  if (!fs.existsSync(config.run.outputDir)) {
    fs.mkdirSync(config.run.outputDir);
  }

  config.subDirs.forEach((d) => {
    if (!fs.existsSync(path.join(config.run.outputDir,d))) {
      fs.mkdirSync(path.join(config.run.outputDir,d));
    }
  });

  console.log("Exporting adventure outline...");

  const adventure = require(path.join(templateDir,"adventure.json"));
  adventure.name = config.run.book;
  adventure.id = utils.randomString(10, "#aA");

  const adventureData = JSON.stringify(adventure);
  fs.writeFileSync(path.join(config.run.outputDir,"adventure.json"), adventureData);
}

function outputJournals(parsedChapters, config) {
  console.log("Exporting journal chapters...");

  // journals out
  parsedChapters.forEach((chapter) => {
    const journalEntry = JSON.stringify(chapter);
    fs.writeFileSync(path.join(config.run.outputDir,"journal",`${chapter._id}.json`), journalEntry);
  });
}

function outputScenes(parsedScenes, config) {
  console.log("Exporting scenes...");

  // scenes out
  parsedScenes.forEach((scene) => {
    const sceneContent = JSON.stringify(scene);
    fs.writeFileSync(path.join(config.run.outputDir,"scene",`${scene._id}.json`), sceneContent);
  });
}


function outputTables(parsedTables, config) {
  console.log("Exporting tables...");

  // tables out
  parsedTables.forEach((table) => {
    const tableContent = JSON.stringify(table);
    fs.writeFileSync(path.join(config.run.outputDir,"table",`${table._id}.json`), tableContent);
  });
}


function outputFolders(parsedFolders, config, content) {
  console.log("Exporting required folders...");

  parsedFolders = parsedFolders.filter((folder) => content.some((content) =>
    folder._id === content.folder ||
    masterFolder[folder.type]._id == folder._id
  ));

  const foldersData = JSON.stringify(parsedFolders);
  fs.writeFileSync(path.join(config.run.outputDir,"folders.json"), foldersData);
}


function generateZipFile(config) {
  console.log("Generating adventure zip...");
  const zip = utils.getZipOfFolder(config.run.outputDir);
  utils.writeZipFile(zip, path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`));
}

function rowGenerate(err, row) {
  if(err){
    console.log("ERROR");
    console.log(err);
    exit();
  }
  if (config.debug) {
    console.log("PARSING: " + row.id + ": " + row.title);
  }
  let document = generateJournalChapterEntry(row);
  generateNoteJournals(row);
  if (document.content) {
    // eslint-disable-next-line no-unused-vars
    let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(document);
    replaceLinks = replaceLinks.concat(tmpReplaceLinks);
  }
}


async function downloadEnhancements(list) {
  for (let i = 0; i < list.length; i++) {
    console.log(`Downloading Hi Res ${list[i].name}`);
    const dlPath = path.join(config.run.outputDir,list[i].path);
    await utils.downloadFile(list[i].url, dlPath);
  } 
}

async function collectionFinished(err, count) {
  if (err) {
    console.error(err);
    exit();
  }
  try {
    console.log(`Processing ${count} entries...`);
    console.log("Looking for missing scenes...");
    [generatedJournals, generatedScenes] = generateMissingScenes(generatedJournals, generatedScenes);
    console.log("Updating links...");
    generatedJournals = updateJournals(generatedJournals);
    console.log("Fixing up tables...");
    [generatedTables, generatedJournals] = fixUpTables(generatedTables, generatedJournals);
    console.log("Complete! Generating output files...");
    outputAdventure(config);
    outputJournals(generatedJournals, config);
    outputScenes(generatedScenes, config);
    outputTables(generatedTables, config);
    const allContent = generatedJournals.concat(generatedScenes, generatedTables);
    outputFolders(generatedFolders, config, allContent);
    await downloadEnhancements(downloadList);
    generateZipFile(config);
  } catch (err) {
    console.log(`Error generating adventure: ${err}`);
    console.log(err.stack);
  } finally {
    console.log("Generated the following journal images:");
    console.log(journalImgMatched);
    console.log("Generated the following scene images:");
    console.log(sceneImgMatched);
    // save generated Ids table
    configure.saveLookups(idTable);
    if (config.tableFind) {
      configure.saveTableData(tableMatched, config.run.bookCode);
    }
    if (config.imageFind) {
      configure.saveImageFinderResults(imageFinderSceneResults, imageFinderJournalResults, config.run.bookCode);
    }
  }
}

async function setConfig(conf) {
  config = conf;
  masterFolder = undefined;
  generatedJournals = [];
  generatedFolders = [];
  generatedScenes = [];
  generatedTables = [];
  imageFinderSceneResults = [];
  imageFinderJournalResults = [];
  sceneImgMatched = [];
  journalImgMatched = [];
  tableMatched = [];
  replaceLinks = [];
  tempHandouts = {};
  fetchLookups(config);
  sceneAdjustments = sceneAdjuster.getSceneAdjustments(config.run.bookCode);
  noteHints = noteHinter.getNoteHints(config.run.bookCode);
  enhancedScenes = await enhance.getEnhancedData(config);
  downloadList = [];
}

function getData(){
  var db = new sqlite3.Database(
    path.join(config.run.sourceDir,`${config.run.bookCode}.db3`),
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) console.log(err);
    });

  db.serialize(function() {
    db.run("PRAGMA cipher_compatibility = 3");
    db.run(`PRAGMA key = '${config.run.key}'`);
    db.run("PRAGMA cipher_page_size = '1024'");
    db.run("PRAGMA kdf_iter = '64000'");
    db.run("PRAGMA cipher_hmac_algorithm = 'HMAC_SHA1'");
    db.run("PRAGMA cipher_kdf_algorithm = 'PBKDF2_HMAC_SHA1'");

    // generate chapter journal entries
    db.each(getAllSQL, rowGenerate, collectionFinished);
  });

  db.close();
}

function setMasterFolders() {
  masterFolder = {
    JournalEntry: generateFolder("JournalEntry", {id: -1, cobaltId: -1, title: config.run.book}, true),
    Scene: generateFolder("Scene", {id: -1, cobaltId: -1, title: config.run.book}, true),
    RollTable: generateFolder("RollTable", {id: -1, cobaltId: -1, title: config.run.book}, true),
  };
}

exports.setMasterFolders = setMasterFolders;
exports.setTemplateDir = setTemplateDir;
exports.getData = getData;
exports.setConfig = setConfig;
exports.fetchLookups = fetchLookups;
