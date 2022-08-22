"use strict";

const utils = require("./utils.js");
const { getAllSQL } = require("./data/sql.js");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { exit } = require("process");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("better-sqlite3-multiple-ciphers");
const _ = require("lodash");
const configure = require("./config.js");
const sceneAdjuster = require("./scene-load.js");
const noteHinter = require("./note-load.js");
const tableHinter = require("./table-load.js");
const enhance = require("./enhance.js");
const parseTable = require("./vendor/parseTable.js");
const replacer = require("./replacer.js");
const icons = require("./icons.js");
const logger = require("./logger.js");

const JOURNAL_SORT = 1000;
const FOLDER_SORT = 4000;
var config;
var idTable;
var sceneAdjustments;
var noteHints;
var tableHints;
var sceneImgMatched = [];
var journalImgMatched = [];
var enhancedScenes = [];
var downloadList = [];
var tableMatched = [];

let replaceLinks = [];
let tempHandouts = {};

var masterFolder;

let documents = [];
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
  logger.debug(`Fetched ${idTable[config.run.bookCode].length} lookups`);
}


function getId(document, docType) {
  const contentChunkId =  (document.flags.ddb.contentChunkId && document.flags.ddb.contentChunkId != "") ? 
    document.flags.ddb.contentChunkId :
    null;

  const existingId = idTable[config.run.bookCode].find((r) => {
    const basicCheck = r.type == document.type &&
      r.docType == docType &&
      r.ddbId == document.flags.ddb.ddbId &&
      r.cobaltId == document.flags.ddb.cobaltId &&
      r.parentId == document.flags.ddb.parentId;
    const chunkCheck = (contentChunkId !== null) ? 
      contentChunkId === r.contentChunkId :
      true;
    const sceneNotes = (document.flags.ddb.note) ? 
      document.name === r.name && r.note :
      true;
    const handout = (document.flags.ddb.img) ? 
      document.name === r.name && r.img :
      true;
    const scenePinIdMatch = (docType === "Note") ?
      document.flags.ddb.pin === r.scenePin :
      true;

    return basicCheck && chunkCheck && sceneNotes && handout && scenePinIdMatch;
  });

  // logger.info(`Finding id for ${docType} ${document.name}`);
  // logger.info(`Note? ${document.flags.ddb.note}`);
  // if (existingId) logger.info(`For ${docType} ${document.name} returning id ${existingId.id} with name ${existingId.name}`)
  // logger.info("------------------")
  
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
      note: (document.flags.ddb.note) ? document.flags.ddb.note : false,
      img: (document.flags.ddb.img) ? document.flags.ddb.img : false,
      scenePin: document.flags.ddb.pin,
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

  const hintName = tableHints.find((hint) => hint.contentChunkId == contentChunkId);

  if (hintName) {
    return hintName.tableName;
  }

  const element = document.querySelector(`table[data-content-chunk-id='${contentChunkId}']`);
  let track = element;
  let sibling = track.previousElementSibling;
  
  // if (!sibling && track.parentElement.nodeName === "DIV") {
  //   sibling = track.parentElement.previousElementSibling;
  // }

  while (!sibling && track.parentElement && track.parentElement.nodeName === "DIV") {
    if (!track.parentElement.previousElementSibling) {
      track = track.parentElement;
    } else {
      sibling = track.parentElement.previousElementSibling;
    }
  }

  if (sibling) {
    logger.info(sibling.textContent);
    return sibling.textContent;
  } else {
    logger.info(`No table name identified for ${contentChunkId}`);
    return `${document.name}: Unknown Table: ${contentChunkId}`;
  }
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function tableReplacer(text, journals) {
  text = replacer.moduleReplaceLinks(text, journals, config);
  text = replacer.foundryCompendiumReplace(text, config);
  text = JSDOM.fragment(text).textContent;
}

function journalTableReplacer(journal, tables) {
  logger.info(`Updating Journal for Table links: ${journal.name}`);
  if (config.v10Mode ? !journal.text.content : !journal.content) return;
  const dom = new JSDOM(config.v10Mode ? journal.text.content : journal.content).window.document;
  tables.forEach((table) => {
    const tablePoint = dom.body.querySelector(`table[data-content-chunk-id="${table.flags.ddb.contentChunkId}"]`);
    if (tablePoint) {
      logger.info(`Updating table reference for: ${table.name}`);
      tablePoint.insertAdjacentHTML("afterend", `<div id="table-link">@RollTable[${table.name}]{Open RollTable}</div>`);
    }
  });
  if (config.v10Mode) {
    journal.text.content = dom.body.innerHTML;
  } else {
    journal.content = dom.body.innerHTML;
  }
}

async function fixUpTables(tables, journals) {
  logger.info("Updating table references for modules...");
  logger.info(`There are ${tables.length} tables`);
  logger.info(`There are ${journals.length} journals`);

  await sleep(1000);
  if (global.gc) global.gc();

  for (let tableIndex = 0, tablesLength = tables.length; tableIndex < tablesLength; tableIndex++) {
    const table = tables[tableIndex];
    logger.info(`Updating table: ${table.name}...`);
    for (let resultsIndex = 0, resultsLength = table.results.length; resultsIndex < resultsLength; resultsIndex++) {
      tableReplacer(table.results[resultsIndex].text, journals);
    }
    if (tableIndex % 10 == 0) {
      await sleep(500);
    }
  }
  await sleep(1000);
  if (global.gc) global.gc();

  logger.info("Starting Journal Table Updates");

  for (let journalIndex = 0, journalsLength = journals.length; journalIndex < journalsLength; journalIndex++) {
    const journal = journals[journalIndex];
    if (config.v10Mode) {
      for (let journalPageIndex = 0, journalPagesLength = journal.pages.length; journalPageIndex < journalPagesLength; journalPageIndex++) {
        if (journal.pages[journalIndex]) journalTableReplacer(journal.pages[journalIndex], tables);
        if (journalPageIndex % 5 == 0) {
          // await sleep(500);
          if (global.gc) await global.gc();
        }
      }
    } else {
      journalTableReplacer(journals[journalIndex], tables);
    }
    if (journalIndex % 5 == 0) {
      await sleep(1000);
      if (global.gc) global.gc();
    }
  }
  
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
  const fragment = JSDOM.fragment(value).textContent;
  const text = fragment.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(/\s/g, "").trim();
  // eslint-disable-next-line no-useless-escape
  const valueRegex = new RegExp(/^(\d+)\-(\d+)|^(\d+)(\+?)$/);
  const valueMatch = text.match(valueRegex);

  logger.warn(valueMatch);

  if (valueMatch) {
    if (valueMatch[1] !== undefined && valueMatch[2] !== undefined) {
      const low = diceInt(valueMatch[1]);
      const high = diceInt(valueMatch[2]);
      return [low, high];
    }

    if (valueMatch[3]) {
      if (valueMatch[4] !== undefined && valueMatch[4] === "+") {
        const low = diceInt(valueMatch[3]);
        return [low, low + 1];
      }
      if (valueMatch[4] !== undefined && valueMatch[4] === "") {
        const low = diceInt(valueMatch[3]);
        return [low, low];
      }
    }
  }
  logger.error("###############################################");
  logger.info(`Unable to table range match ${value}`);
  logger.info(`Text value: ${text}`);
  logger.error("###############################################");
  return [];
}


function buildTable(row, parsedTable, keys, diceKeys, tableName, contentChunkId) {
  let tmpCount = 1;
  diceKeys.forEach((diceKey) => {
    const table = JSON.parse(JSON.stringify(require(path.join(templateDir,"table.json"))));
    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";

    table.name = ((tableName && tableName !== "") ? tableName : "Unnamed Table") + nameExtension;
    table.flags.ddb.ddbId = row.id;
    table.flags.ddb.bookCode = config.run.bookCode;
    table.flags.ddb.slug = row.slug;
    table.flags.ddb.contentChunkId = contentChunkId;
    table.flags.ddb.userData = config.run.userData;
    table.sort = JOURNAL_SORT + parseInt(row.id);
    if (row.cobaltId) table.flags.ddb.cobaltId = row.cobaltId;
    if (row.parentId) table.flags.ddb.parentId = row.parentId;

    if (config.observeAll) table.permission.default = 2;

    const tableHint = tableHints.find((hint) => hint.contentChunkId == contentChunkId);
    const cobaltId = (table.flags.ddb.cobaltId) ? table.flags.ddb.cobaltId : table.flags.ddb.parentId;
    const folderName = (tableHint && tableHint.folderName) ? tableHint.folderName : null;

    const tableRow = {
      title: table.name,
      id: 10000 + table.flags.ddb.ddbId + tmpCount,
      cobaltId: cobaltId,
      documentName: table.name,
      contentChunkId: contentChunkId,
      nameOverride: folderName,
    };

    table.folder = getFolderId(tableRow, "RollTable");
    table._id = getId(table, "RollTable");

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);
    //logger.info(formulaMatch);
    table.formula = formulaMatch ? formulaMatch[0].trim() : "";

    table.results = [];
    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry. 
    // if more than one result key then we will concat the results.

    logger.info("*******************************************");
    logger.info(`Generating table ${table.name}`);
    if (config.debug) logger.debug(row);
    // logger.info(parsedTable.length);

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
        if (key === diceKey) {
          result.range = getDiceTableRange(value);
        }
        else if (diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.text != "") result.text += "\n\n";
          result.text += `<b>${key}</b>${value}`;
        } else {
          result.text = value;
        }
      });
      result.text = replacer.replaceRollLinks(result.text, config);
      const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
      result.text = result.text.replace(diceRollerRegexp, "[[$1]] ($&)");
      table.results.push(result);
    });

    logger.info(`Generated table entry ${table.name}`);
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
    let nameGuess = guessTableName(document, contentChunkId);

    if (nameGuess.split(" ").length > 5 && diceKeys.length === 1 && keys.length === 2) {
      nameGuess = keys[1];
    }

    logger.info("***********************************************");
    logger.info("Table detection!");
    logger.info(`Table: "${nameGuess}"`);
    logger.info(`ContentChunkId: ${contentChunkId}`);
    logger.info(`Dice Keys: ${diceKeys.join(", ")}`);
    logger.info(`Keys: ${keys.join(", ")}`);
    logger.info("***********************************************");
    if (config.debug) logger.debug(node.outerHTML);
    if (config.debug && parsedTable) logger.debug(parsedTable);
    // if (parsedTable) logger.info(parsedTable);
    logger.info("***********************************************");
    
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

function updateJournal(documents, name, content) {
  logger.info("***********************");
  logger.info(`Updating: ${name}`);
  if (content) {
    content = content.replace(/\s+/g, " ");
    // logger.info(doc.content);
    logger.info("---------------");
    logger.info(`Replacing generate link content for ${name}`);
    replaceLinks.forEach((link) => {
      // logger.info(link);
      // logger.info(doc.content.includes(link.html));
      content = content.replace(link.html, link.ref);
    });
    logger.info(`Replacing image links for ${name}`);
    content = replacer.replaceImageLinks(content, config);
    logger.info(`Linking module content for ${name}`);
    content = replacer.moduleReplaceLinks(content, documents, config);
    logger.info(`Linking ddb-importer compendium content for ${name}`);
    content = replacer.foundryCompendiumReplace(content, config);
    logger.info(`Generating dice rolls for ${name}`);
    content = replacer.replaceRollLinks(content, config);
    // fs.writeFileSync(path.join(config.run.outputDir,"html",`${doc._id}.html`), doc.content);
    logger.info(`Fixing up classes for ${name}`);
    content = replacer.addClasses(content);
  }
  if (global.gc) global.gc();
  return content;
}

function updateJournals(documents) {
  // logger.info(replaceLinks);
  documents = documents.map((doc) => {
    if (config.v10Mode) {
      doc.pages = doc.pages.map((page) => {
        if (page.text.content) {
          page.text.content = updateJournal(documents, page.name, page.text.content);
        }
        return page;
      });
    } else {
      doc.content = updateJournal(documents, doc.name, doc.content);
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
  folder.sort = FOLDER_SORT + parseInt(row.id);
  if (row.cobaltId && !baseFolder) {
    folder.parent = masterFolder[type]._id;
  }
  if (note) {
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    folder.name = `[Pins] ${row.sceneName ? row.sceneName : parent.name}`;
    // folder.sort = 900000;
    folder.sorting = "a";
    folder.parent = `${parent._id}`;
    folder.flags.ddb.parentId = parentId;
  }
  else if (img) {
    // logger.info(row);
    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    folder.name = `[Handouts] ${row.sceneName ? row.sceneName : (parent) ? parent.name: row.title }`;
    folder.sort = 1000000;
    if (parent) { // tmp fix for hftt, for some reason it does not generate a parent folder
      folder.parent = `${parent._id}`;
    }
    folder.flags.ddb.parentId = parentId;
  } else if (row.parentId) {
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && !f.flags.ddb.img);
    if (parent) {
      folder.parent = `${parent._id}`;
      folder.name = `[Sections] ${parent.name}`;
    }
    folder.flags.ddb.parentId = row.parentId;
    if (!folder.name || folder.name === "") {
      logger.warn("NO NAME ROW FOUND (parent)!!!");
    }

  } else if(!baseFolder) {
    const parent = generatedFolders.find((f) => f.flags.ddb.cobaltId == -1 && f.type == type && !f.flags.ddb.img);
    if (parent) folder.parent = `${parent._id}`;
    if (!folder.name || folder.name === "") {
      logger.warn("NO NAME ROW FOUND!!!");
    }
  }
  if (row.cobaltId) folder.flags.ddb.cobaltId = row.cobaltId;

  if (baseFolder && type === "Actor") folder.sorting = "a";

  if (row.nameOverride) folder.name = row.nameOverride;

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
  } else if (row.parentId) {
    folder = generatedFolders.find((f) => f.flags.ddb.parentId == row.parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
    if (!folder) folder = generateFolder(type, row, false, img, note);
    folderId = folder._id;
  }
  // else {
  //   folder = generatedFolders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && f.flags.ddb.img == img && f.flags.ddb.note == note);
  //   if (folder) folderId = folder._id;
  // }
  return folderId;
}

function generateV10Page({name, content, flags, id, type = "text", level = 1}) {
  let page = {
    name: name,
    // name: journalEntry.name,
    type,
    title: {
      show: false,
      level,
    },
    // _id: journalEntry._id,
    _id: id,
    text: {
      format: 1,
    },
    video: {
      controls: true,
      volume: 0.5,
    },
    image: {},
    src: null,
    sort: 0,
    ownership: {
      default: -1,
    },
    flags: flags,
    // flags: journalEntry.flags,
  };

  switch (type) {
    case "text": {
      page.text.content = content;
      break;
    }
    case "image": {
      page.title.show = true;
      page.src = content;
      break;
    }
    case "pdf": {
      page.src = content;
      break;
    }
    //no default
  }

  return page;
}

function appendJournalToChapter(row, journalEntry) {
  if (row.parentId) {
    logger.info(`Appending to chapter... ${row.title} ${row.parentId} search...`);
    generatedJournals.forEach((journal) => {
      const imageCheck = config.v10Mode
        ? !journal.flags.ddb.img && !journal.flags.ddb.note
        : journal.img === null || journal.img === undefined || journal.img == "";
      if (journal.flags.ddb.cobaltId == row.parentId && imageCheck) {
        if (config.v10Mode && journalEntry.pages.length > 0) {
          const page = journalEntry.pages[0];
          if (page.name != journal.name) {
            page.title.show = true;
          }
          journal.pages.push(page);
        } else {
          journal.content += row.html;
        }
      }
    });
  }
}

function generateJournalEntryV10(row, img=null, note=false) {
  let journal = JSON.parse(JSON.stringify(require(path.join(templateDir, "journal-v10.json"))));

  const name = row.title;
  journal.name = name;
  journal.flags.ddb.ddbId = row.id;
  journal.flags.ddb.bookCode = config.run.bookCode;
  journal.flags.ddb.slug = row.slug;
  const contentChunkId = (row.contentChunkId && row.contentChunkId.trim() != "") ? 
    row.contentChunkId :
    null;
  journal.flags.ddb.contentChunkId = contentChunkId;
  journal.flags.ddb.userData = config.run.userData;
  journal.flags.ddb.originDocId = row.originDocId;
  journal.flags.ddb.originHint = row.originHint;
  journal.flags.ddb.originalLink = row.originalLink;
  journal.flags.ddb.note = note;

  if (config.observeAll) journal.ownership.default = 2;

  journal.sort = JOURNAL_SORT + parseInt(row.id);
  if (row.cobaltId) journal.flags.ddb.cobaltId = row.cobaltId;
  const imgState = (img !== null && img !== "") ? true : false;
  journal.flags.ddb.img = imgState;
  let content;
  let type;
  if (imgState) {
    content = replacer.replaceImgLinksForJournal(img, config);
    type = "image";
    journal.flags.ddb.imageSrc = content;
    if (journalImgMatched.includes(content)) {
      const journalMatch =  generatedJournals.map((j) => j.pages).flat().find((j) => j.src === content);
      journal.flags.ddb.duplicate = true;
      journal.flags.ddb.linkId = journalMatch ? journalMatch._id : null;
      journal.flags.ddb.linkName = journalMatch ?journalMatch.name : null;
    } else {
      journal.flags.ddb.duplicate = false;
      journal.flags.ddb.linkName = name;
      if (config.imageFind) {
        imageFinderJournalResults.push({
          bookCode: config.run.bookCode,
          img: content,
          name: name,
          slug: row.slug,
        });
      }
    }
    journalImgMatched.push(content);
    const journalHandoutCount = journalImgMatched.filter(img => img === content).length;
    logger.info(`Generated Handout ${name}, "${content}", (count ${journalHandoutCount}), Duplicate? ${journal.flags.ddb.duplicate}`);
  } else {
    const dom = new JSDOM(row.html);
    const firstElement = dom.window.document.body.firstElementChild;
    const allFirstElements = dom.window.document.body.getElementsByTagName(firstElement.tagName);
    if (firstElement === "H1" || allFirstElements.length === 1) {
      firstElement.remove();
    }
    content = dom.window.document.body.innerHTML.replace(/\s+/g, " ");
    if (!note) generateTable(row, journal, content);
    type = "text";
  }

  if (row.parentId) journal.flags.ddb.parentId = row.parentId;
  if (!row.ddbId) row.ddbId = row.id;
  journal.folder = getFolderId(row, "JournalEntry", imgState, note);
  journal._id = getId(journal, "JournalEntry");

  const page = generateV10Page({name: row.title, content, flags: journal.flags, id: journal._id, type, level: 1});
  
  logger.info(`Generated journal page entry ${name}`);
  if (!journal.flags.ddb.duplicate && !row.parentId) journal.flags.ddb.linkId = journal._id;
  journal.pages.push(page);
  if (!imgState && !note) {
    appendJournalToChapter(row, journal);
  }

  const createImgHandouts = ((config.createHandouts && !row.player) || (row.player && config.createPlayerHandouts)) && imgState;
  if (!journal.flags.ddb.duplicate && (createImgHandouts || note || !row.parentId)) {
    logger.info(`Appending ${name} Img:"${journal.flags.ddb.imageSrc}"`);
    generatedJournals.push(journal);
  }
  return journal;
}

function generateJournalEntryOld(row, img=null, note=false) {
  let journal = JSON.parse(JSON.stringify(require(path.join(templateDir,"journal.json"))));

  journal.name = row.title;
  journal.flags.ddb.ddbId = row.id;
  journal.flags.ddb.bookCode = config.run.bookCode;
  journal.flags.ddb.slug = row.slug;
  const contentChunkId = (row.contentChunkId && row.contentChunkId.trim() != "") ? 
    row.contentChunkId :
    null;
  journal.flags.ddb.contentChunkId = contentChunkId;
  journal.flags.ddb.userData = config.run.userData;
  journal.flags.ddb.originDocId = row.originDocId;
  journal.flags.ddb.originHint = row.originHint;
  journal.flags.ddb.originalLink = row.originalLink;
  journal.flags.ddb.note = note;

  if (config.observeAll) journal.permission.default = 2;

  journal.sort = JOURNAL_SORT + parseInt(row.id);
  if (row.cobaltId) journal.flags.ddb.cobaltId = row.cobaltId;
  const imgState = (img !== null && img !== "") ? true : false;
  journal.flags.ddb.img = imgState;
  if (imgState) {
    journal.img = replacer.replaceImgLinksForJournal(img, config);
    if (journalImgMatched.includes(journal.img)) {
      const journalMatch = generatedJournals.find((j) => j.img === journal.img);
      journal.flags.ddb.duplicate = true;
      journal.flags.ddb.linkId = journalMatch ? journalMatch._id : null;
      journal.flags.ddb.linkName = journalMatch ?journalMatch.name : null;
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
    logger.info(`Generated Handout ${journal.name}, "${journal.img}", (count ${journalHandoutCount}), Duplicate? ${journal.flags.ddb.duplicate}`);
  } else {
    const dom = new JSDOM(row.html);
    const firstElement = dom.window.document.body.firstElementChild;
    try {
      const allFirstElements = dom.window.document.body.getElementsByTagName(firstElement.tagName);
      if (firstElement === "H1" || allFirstElements.length === 1) {
        firstElement.remove();
      }
      journal.content = dom.window.document.body.innerHTML.replace(/\s+/g, " ");
      if (!note) generateTable(row, journal, journal.content);
    } catch (err) {
      logger.error("Journal Generation failed, bad note row?", row);
      throw err;
    }
  }
  if (row.parentId) journal.flags.ddb.parentId = row.parentId;
  if (!row.ddbId) row.ddbId = row.id;
  journal.folder = getFolderId(row, "JournalEntry", imgState, note);
  journal._id = getId(journal, "JournalEntry");
  logger.info(`Generated journal entry ${journal.name}`);
  if (!imgState && !note) {
    appendJournalToChapter(row);
  }

  const createImgHandouts = ((config.createHandouts && !row.player) || (row.player && config.createPlayerHandouts)) && imgState;
  if (!journal.flags.ddb.duplicate && (createImgHandouts || note)) {
    journal.flags.ddb.linkId = journal._id;
    logger.info(`Appending ${journal.name} Img:"${journal.img}"`);
    generatedJournals.push(journal);
  }
  return journal;
}

function generateJournalEntry(row, img=null, note=false) {
  if (config.v10Mode) {
    return generateJournalEntryV10(row, img, note);

  } else {
    return generateJournalEntryOld(row, img, note);
  }
}

function getNoteTitle(html) {
  const pDom = new JSDOM(html).window.document;
  const boldText = pDom.querySelector("b, strong");
  if (boldText) {
    return boldText.textContent;
  } else {
    return pDom.body.textContent;
  }

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
    logger.info("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
    logger.info(`Generating Notes for ${hint.slug} ContentChunkId ${hint.contentChunkIdStart}`);
    logger.info(`${hint.splitTag}[data-content-chunk-id='${hint.contentChunkIdStart}']`);
    
    let keyChunk = dom.querySelector(`${hint.splitTag}[data-content-chunk-id='${hint.contentChunkIdStart}']`);
    logger.info(`keyChunk: ${keyChunk}`);
    if (!keyChunk) {
      logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      logger.info(`WARNING NO keyChunk found for ${hint.slug} ContentChunkId ${hint.contentChunkIdStart}`);
      logger.info(hint);
      logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      return;
    }
    let html = "";
    let noteTitle = getNoteTitle(keyChunk.innerHTML);
    let keyChunkId = hint.contentChunkIdStart;
    let idTagStop = hint.contentChunkIdStop === "IDSTOP";

    while (true) {
      const pTag = hint.splitTag.toUpperCase() === "P";
      // if this is the first p tag add the full p tag to the html
      if (pTag && hint.contentChunkIdStart === keyChunkId) {
        html += keyChunk.innerHTML;
        //logger.warn("html: ", html);
      }

      tmpCount++;
      keyChunk = keyChunk.nextElementSibling;

      const chunkId = keyChunk ? keyChunk.getAttribute("data-content-chunk-id") : undefined;
      // when we match against a P, we never stop
      const tagMatch = keyChunk ? keyChunk.tagName.toUpperCase() === hint.splitTag.toUpperCase() : false;
      const idStop = (idTagStop && keyChunk.getAttribute("id") === hint.tagIdLast) || hint.contentChunkIdStart === hint.contentChunkIdStop;
      const stopChunk = keyChunk === null || chunkId === hint.contentChunkIdStop || idStop;

      // if we have reached the same tag type or last chunk generate a journal
      if ((tagMatch && !pTag) || stopChunk) {
        let noteRow = JSON.parse(JSON.stringify(row));
        noteRow.html = html;

        const numMatch = noteTitle.match(/^(\d+)(.*)/);
        const letterNumMatch = noteTitle.match(/^([a-z,A-Z])(\d+)(.*)/);
        if (numMatch) {
          const prefix = utils.zeroPad(numMatch[1],2);
          noteRow.title = `${prefix}${numMatch[2]}`;
        } else if (letterNumMatch) {
          const prefix = utils.zeroPad(letterNumMatch[2],2);
          noteRow.title = `${letterNumMatch[1]}${prefix}${letterNumMatch[3]}`;
        } else {
          noteRow.title = noteTitle;
        }

        noteRow.contentChunkId = keyChunkId;
        noteRow.sceneName = hint.sceneName;
        noteRow.id  = id + tmpCount;
        noteRow.ddbId = row.id;
        notes.push(generateJournalEntry(noteRow, null, true));
        html = "";
        noteTitle = "";
      }

      // if we have reached the end leave
      if (stopChunk) {
        break;
      } else if ((tagMatch && !pTag) || (noteTitle === "" && pTag)) {
        noteTitle = getNoteTitle(keyChunk.innerHTML);
        keyChunkId = chunkId;
      } else {
        // we add the chunk contents to the html block
        html += keyChunk.outerHTML;
      }

    }

    logger.info("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
  });

  return notes;
}

function generateScene(row, img) {
  let scene = JSON.parse(JSON.stringify(require(path.join(templateDir,"scene.json"))));

  scene.name = row.sceneName;
  scene.navName = row.sceneName.split(":").pop().trim();
  logger.info(`Generating Scene ${scene.name}`);

  let journalMatch = config.v10Mode
    ? generatedJournals.map((j) => j.pages).flat().find((journal) => journal._id === row.originDocId)
    : generatedJournals.find((journal) => journal._id === row.originDocId);
  if (!journalMatch) {
    journalMatch = config.v10Mode
      ? generatedJournals.map((j) => j.pages).flat().find((journalPage) => 
        journalPage.name.includes(scene.navName) &&
        !journalPage.flags.ddb.notes && !journalPage.flags.ddb.img && !journalPage.src
      )
      : generatedJournals.find((journal) => 
        journal.name.includes(scene.navName) &&
        !journal.flags.ddb.notes && !journal.flags.ddb.img && !journal.img
      );
  }
  if (journalMatch) scene.journal = journalMatch._id;

  scene.img = img;
  scene.flags.ddb.documentName = row.documentName;
  scene.flags.ddb.ddbId = row.id;
  scene.flags.ddb.bookCode = config.run.bookCode;
  scene.flags.ddb.slug = row.slug;
  // logger.info("#############################");
  // logger.info(row);
  // logger.info("#############################");
  const contentChunkId =  (row.contentChunkId && row.contentChunkId != "") ? 
    row.contentChunkId :
    null;
  scene.flags.ddb.contentChunkId = contentChunkId;
  scene.flags.ddb.userData = config.run.userData;
  scene.flags.ddb.originDocId = row.originDocId;
  scene.flags.ddb.originHint = row.originHint;
  scene.flags.ddb.originalLink = row.originalLink;
  scene.flags.ddb.versions = {
    "adventureMuncher": config.run.version
  };

  scene.sort = JOURNAL_SORT + parseInt(row.id);
  if (row.cobaltId) scene.flags.ddb.cobaltId = row.cobaltId;
  if (row.parentId) {
    row.cobaltId = row.parentId;
    scene.flags.ddb.parentId = row.parentId;
    delete row.parentId;
  }
  row.title = row.documentName;
  scene.folder = getFolderId(row, "Scene");

  const imagePath = path.join(config.run.outputDir,img);
  const dimensions = utils.imageSize(imagePath);
  // logger.info(dimensions.width, dimensions.height);
  scene.width = dimensions.width;
  scene.height = dimensions.height;
  // logger.info(row);
  // logger.info(journal);
  // logger.info(`${journal.name}, ${journal.folder}`);

  let adjustment = (scene.flags.ddb.contentChunkId) ?
    sceneAdjustments.find((s) =>
      (scene.flags.ddb.contentChunkId === s.flags.ddb.contentChunkId &&
      scene.flags.ddb.ddbId == s.flags.ddb.ddbId &&
      scene.flags.ddb.parentId == s.flags.ddb.parentId &&
      scene.flags.ddb.cobaltId == s.flags.ddb.cobaltId) ||
      (s.flags.ddb.alternateIds && s.flags.ddb.alternateIds.some((ai) =>
        scene.flags.ddb.contentChunkId === ai.contentChunkId &&
        scene.flags.ddb.ddbId == ai.ddbId &&
        scene.flags.ddb.parentId == ai.parentId &&
        scene.flags.ddb.cobaltId == ai.cobaltId
      ))
    ) :
    sceneAdjustments.find((s) => scene.name.includes(s.name));

  if (adjustment) {
    logger.info(`ADJUSTMENTS found named ${adjustment.name} with chunkid "${adjustment.flags.ddb.contentChunkId}" and id ${adjustment.flags.ddb.ddbId}`);
    if (adjustment.flags.ddb.tiles) {
      adjustment.tiles = adjustment.flags.ddb.tiles;
    }
    if (adjustment.flags.ddb.notes) {
      logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      logger.info("Found notes!!!!!");

      adjustment.notes = [];

      adjustment.flags.ddb.notes.forEach((note) => {
        logger.info(`Checking ${note.label}`);
        const noteJournal = generatedJournals.find((journal) => {
          const contentChunkIdMatch = note.flags.ddb.contentChunkId ?
            journal.flags.ddb && note.flags.ddb && journal.flags.ddb.contentChunkId == note.flags.ddb.contentChunkId :
            false;

          const noContentChunk = !note.flags.ddb.contentChunkId &&
            note.flags.ddb.originalLink && note.flags.ddb.ddbId && note.flags.ddb.parentId &&
            note.flags.ddb.slug && note.flags.ddb.linkName;
          const originMatch = noContentChunk ?
            journal.flags.ddb.slug == note.flags.ddb.slug &&
            journal.flags.ddb.ddbId == note.flags.ddbId &&
            journal.flags.ddb.parentId == note.flags.ddb.parentId &&
            journal.flags.ddb.cobaltId == note.flags.ddb.cobaltId &&
            journal.flags.ddb.originalLink == note.flags.ddb.originalLink &&
            journal.flags.ddb.linkName == note.flags.ddb.linkName :
            false;
          const journalNameMatch = !contentChunkIdMatch && !originMatch ?
            config.v10Mode
              ? journal.pages.some((page) => page.name.trim() === note.label.trim())
              : journal.name.trim() == note.label.trim() :
            false;
          return contentChunkIdMatch || originMatch || journalNameMatch;

        });
        if (noteJournal){
          logger.info(`Found ${note.label} matched to ${noteJournal._id} (${noteJournal.name})`);
          note.positions.forEach((position) => {
            noteJournal.flags.ddb.pin = `${position.x}${position.y}`;
            const noteId = getId(noteJournal, "Note");
            const n = {
              "_id": noteId,
              "flags": {
                "ddb": note.flags.ddb,
                "importid": noteId,
              },
              "entryId": noteJournal._id,
              "x": position.x,
              "y": position.y,
              "icon": icons.generateIcon(config, note.label, templateDir),
              "iconSize": note.iconSize ? note.iconSize : 40,
              "iconTint": "",
              "text": "",
              "fontFamily": note.fontFamily ? note.fontFamily : "Signika",
              "fontSize": note.fontSize ? note.fontSize : 48,
              "textAnchor": 1,
              "textColor": note.textColor ? note.textColor : "",
            };
            adjustment.notes.push(n);
          });
        }
        logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      });
    }
    delete adjustment.flags.ddb.notes;
    delete adjustment.flags.ddb.cobaltId;
    delete adjustment.flags.ddb.parentId;
    delete adjustment.flags.ddb.ddbId;
    delete adjustment.flags.ddb.contentChunkId;
    adjustment.flags.ddb["sceneAdjustment"] = true;
    logger.info(adjustment.flags);
    logger.info(scene.flags);
    scene = _.merge(scene, adjustment);
  } else {
    logger.info(`NO ADJUSTMENTS found with chunkid "${scene.flags.ddb.contentChunkId}" and id ${scene.flags.ddb.ddbId}`);
  }

  if (config.imageFind) {
    imageFinderSceneResults.push({
      bookCode: config.run.bookCode,
      img: scene.img,
      name: scene.name,
      slug: row.slug,
      contentChunkId: contentChunkId,
      ddbId: scene.flags.ddb.ddbId,
      parentId: scene.flags.ddb.parentId,
      cobaltId: scene.flags.ddb.cobaltId,
    });
  }

  const disableEnhancedDownloads = (config.disableEnhancedDownloads) ? 
    config.disableEnhancedDownloads :
    false;

  if (config.debug) logger.debug(`Scene name: "${scene.name}" Img: "${scene.img}"`);
  //const enhancedScene = enhancedScenes.find((es) => es.name === scene.name && es.img === scene.img);
  const enhancedScene = enhancedScenes.find((es) => {
    const missingNameMatch = row.missing ?
      es.missing && row.title === es.name :
      true;
    return missingNameMatch && 
      es.img === scene.img &&
      es.bookCode === config.run.bookCode;
  });
  if (config.debug) logger.debug(enhancedScene);

  if (enhancedScene) {
    if (enhancedScene.adjustName && enhancedScene.adjustName.trim() != "") {
      scene.name = enhancedScene.adjustName;
      scene.navName = enhancedScene.adjustName;
    }
    if (enhancedScene.hiresImg && !disableEnhancedDownloads) {
      downloadList.push({name: scene.name, url: enhancedScene.hiresImg, path: scene.img });
    }
  }
  if (config.debug) logger.debug(`Scene name: "${scene.name}" Img: "${scene.img}"`);

  scene._id = getId(scene, "Scene");

  if (scene.flags.ddb.tokens && scene.flags.ddb.tokens.length > 0) {
    scene.tokens = scene.flags.ddb.tokens
      .filter((token) => token.flags.ddbActorFlags && token.flags.ddbActorFlags.id)
      .map((token) => {
        const mockActor = {
          flags: {
            ddb: {
              contentChunkId: token.flags.ddbActorFlags.id,
              ddbId: `DDB-Monster-${token.flags.ddbActorFlags.id}`,
              cobaltId: null,
              parentId: null,
            },
          },
          type: "Actor",
        };

        token.actorId = getId(mockActor, "Actor");

        // Get the compendium id for the token's actor
        const lookupEntry = config.lookups["monsters"].find((e) => e.id == token.flags.ddbActorFlags.id);
        token.flags.actorFolderId = masterFolder["Actor"]._id;
        if (lookupEntry) {
          token.flags.compendiumActorId = lookupEntry._id;
        } else {
          logger.info(`Found actor with Id ${token.flags.ddbActorFlags.id}`);
        }

        if (!config.run.required["monsters"].includes(String(token.flags.ddbActorFlags.id))) {
          config.run.required["monsters"].push(String(token.flags.ddbActorFlags.id));
        }

        // these may have been gathered by accident
        delete token.bar2;
        delete token.displayName;
        return token;
      });
    // delete scene.flags.ddb.tokens;
  } else {
    scene.tokens = [];
  }

  generatedScenes.push(scene);
  sceneImgMatched.push(scene.img);
  const sceneCount = sceneImgMatched.filter(img => img === scene.img).length;
  logger.info(`Generated Scene "${scene.name}" with "${scene.img}", (count ${sceneCount})`);
  return scene;
}

function generateMissingScenes(journals, scenes) {
  let tmpCount = 0;
  //let lastDDBId = 0;

  logger.info("****************************");
  logger.info("Generating Missing Scenes");
  logger.info("----------------------------");
  logger.info(enhancedScenes.filter((es) => es.missing));
  logger.info("----------------------------");

  enhancedScenes.filter((es) => es.missing).forEach((es) => {
    // if (lastDDBId != 0 & es.ddbId != lastDDBId) tmpCount = 0;
    const id =  90000 + es.ddbId + tmpCount;
    const adjustName = (es.adjustName && es.adjustName !== "") ? es.adjustName : es.name;
    const row = {
      title: `${es.name}`,
      id: id,
      slug: es.slug,
      parentId: es.parentId,
      cobaltId: es.cobaltId,
      documentName: es.name,
      sceneName: adjustName,
      contentChunkId: `ddb-missing-${config.run.bookCode}-${id}`,
      missing: true,
    };
    logger.info(`Attempting ${row.title} with ${row.contentChunkId}`);
    tmpCount++;
    const playerEntry = generateJournalEntry(row, es.img);
    journals.push(playerEntry);
    //scenes.push(generateScene(row, es.img));
    generateScene(row, es.img);
    //lastDDBId = es.ddbId;
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
  const frag = new JSDOM(config.v10Mode ? document.text.content : document.content);
  if (config.v10Mode) {
    document.text.content = frag.window.document.body.innerHTML;
  } else {
    document.content = frag.window.document.body.innerHTML;
  }

  logger.info("----------------------------------------------");
  logger.info(`Finding Scenes in ${document.name}`);

  // let possibleSceneNodes = frag.querySelectorAll("a[data-lightbox]");
  let possibleFigureSceneNodes = frag.window.document.body.querySelectorAll("figure");
  let possibleDivSceneNodes = frag.window.document.body.querySelectorAll("div.compendium-image-with-subtitle-center, div.compendium-image-with-subtitle-right, div.compendium-image-with-subtitle-left");
  let possibleHandouts = frag.window.document.body.querySelectorAll("img.ddb-lightbox-inner");
  let possibleViewPlayerScenes = frag.window.document.body.querySelectorAll("p.compendium-image-view-player");
  let possibleUnknownPlayerLinks = frag.window.document.body.querySelectorAll("a.ddb-lightbox-inner, a.ddb-lightbox-outer");

  // if (config.debug) {
  logger.info(`possibleFigureSceneNodes ${possibleFigureSceneNodes.length}`);
  logger.info(`possibleDivSceneNodes ${possibleDivSceneNodes.length}`);
  logger.info(`possibleHandouts ${possibleHandouts.length}`);
  logger.info(`possibleViewPlayerScenes ${possibleViewPlayerScenes.length}`);
  // }

  if (possibleFigureSceneNodes.length > 0) {
    possibleFigureSceneNodes.forEach((node) => {
      let caption = node.querySelector("figcaption");
      let img = node.querySelector("img");

      if (!img || !img.src) return;
      tmpCount++;

      if (caption) {
        // logger.info(document);
        let title = caption.textContent.trim();
        const playerRef = node.querySelector("a[data-title~=Player]");
        if (playerRef) {
          if (title !== playerRef.textContent) {
            title = utils.titleString(title.replace(playerRef.textContent, "").trim());
          }
          logger.warn(`possibleFigureSceneNodes Player TITLE: ${title}`);

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
            sceneName: title,
            contentChunkId: rowContentChunkId,
            originDocId: document._id,
            originHint: "possibleFigureSceneNodes, player",
            originalLink: playerRef.href,
            player: true,
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          journals.push(playerEntry);
          const dmText = config.createHandouts ? `@JournalEntry[${title}]{DM Version} ` : "";
          const playerText = config.createPlayerHandouts ? `@JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version}` : "";
          linkReplaces.push( {html: playerRef.outerHTML, ref: `${dmText}${playerText}` });
          if (config.v10Mode) {
            document.text.content = document.text.content.replace(playerRef.outerHTML, `${dmText}${playerText}`);
          } else {
            document.content = document.content.replace(playerRef.outerHTML, `${dmText}${playerText}`);
          }
          scenes.push(generateScene(row, config.v10Mode ? playerEntry.pages[0].src : playerEntry.img));
        }

        let contentChunkId = node.getAttribute("data-content-chunk-id");
        if (!contentChunkId) {
          // figure type embedds mostly don't have content chunk Id's 
          // we fall back to element ID which appears to be unique for the outer figure element
          contentChunkId = node.id;
        }

        if (!title || title === "") {
          title = `Handout ${unknownHandoutCount}`;
          unknownHandoutCount++;
        }

        logger.warn(`possibleFigureSceneNodes DM TITLE: ${title}`);
        let row = {
          title: utils.titleString(title),
          id: 10000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: contentChunkId,
          slug: document.flags.ddb.slug,
          originHint: "possibleFigureSceneNodes, dm",
          originalLink: img.src,
        };
        const journalEntry = generateJournalEntry(row, img.src);
        if (!playerRef) {
          // document.content = document.content.replace(img.outerHTML, `${img.outerHTML} @JournalEntry[${journalEntry.flags.ddb.linkName}]{${journalEntry.name}}`);
          const linkId = journalEntry.flags.ddb.linkId ? journalEntry.flags.ddb.linkId : journalEntry._id;
          const dmText = config.createHandouts ? ` @JournalEntry[${linkId}]{${journalEntry.name}}` : "";
          linkReplaces.push( {html: img.outerHTML, ref: `${img.outerHTML}${dmText}}` });
        }
        // if (!journalEntry.flags.ddb.duplicate) {
        if (config.createHandouts) journals.push(journalEntry);
        //}
      }
    });
  }

  if (possibleFigureSceneNodes.length == 0 && possibleDivSceneNodes.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleDivSceneNodes.forEach((node) => {
      let caption = node.querySelector("h3, h4");
      let img = node.querySelector("img");

      if (!img || !img.src) return;
      tmpCount++;

      if (caption) {
        logger.info(`Checking ${caption.textContent} for Scenes`);
        // logger.info(document);
        let title = caption.textContent;
        let nextNode = frag.window.document.getElementById(node.id);
        let playerVersion = false;
        let lightBoxNode;

        for (let i = 0; i < 15; i++) {
          if (!nextNode) {
            lightBoxNode = Array.from(node.querySelectorAll("a.ddb-lightbox-outer"))
              .find(el => el.textContent.toLowerCase().includes("player"));
            // logger.info(lightBoxNode.outerHTML)
            // logger.info(`Attempting div query ${lightBoxNode}`)
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
        // logger.info(lightBoxNode)
        // logger.info(playerVersion);

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
            originDocId: document._id,
            originHint: "possibleDivSceneNodes, player",
            originalLink: playerRef.href,
            player: true,
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          journals.push(playerEntry);
          const dmText = config.createHandouts ? `@JournalEntry[${title}]{DM Version} ` : "";
          const playerText = config.createPlayerHandouts ? `@JournalEntry[${playerEntry.flags.ddb.linkName}]{Player Version}` : "";

          linkReplaces.push( {html: playerRef.outerHTML, ref: `${dmText}${playerText}` });
          if (config.v10Mode) {
            document.text.content = document.text.content.replace(playerRef.outerHTML, `${dmText}${playerText}`);
          } else {
            document.content = document.content.replace(playerRef.outerHTML, `${dmText}${playerText}`);
          }
          scenes.push(generateScene(row, config.v10Mode ? playerEntry.pages[0].src : playerEntry.img));
        }

        let row = {
          title: title,
          id: 11000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: caption.getAttribute("data-content-chunk-id"),
          slug: document.flags.ddb.slug,
          originHint: "possibleDivSceneNodes, dm",
          originalLink: img.src,
        };
        const journalEntry = generateJournalEntry(row, img.src);
        if (!playerVersion) {
          // document.content = document.content.replace(img.outerHTML, `${img.outerHTML} @JournalEntry[${journalEntry.flags.ddb.linkId}]{${title}}`);
          const linkId = journalEntry.flags.ddb.linkId ? journalEntry.flags.ddb.linkId : journalEntry._id;
          const dmText = config.createHandouts ? ` @JournalEntry[${linkId}]{${title}}` : "";
          linkReplaces.push( {html: img.outerHTML, ref: `${img.outerHTML}${dmText}}` });
        }
        if (config.createHandouts) journals.push(journalEntry);
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
        logger.verbose(aNode.outerHTML);
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
        originDocId: document._id,
        originHint: "possibleViewPlayerScenes, player",
        originalLink: aNode.href,
        player: true,
      };
      const journalEntry = generateJournalEntry(row, aNode.href.replace("ddb://image", "."));

      // don't add entry if we have already parsed this
      // 
      if (!journalEntry.flags.ddb.duplicate) {
        const playerText = config.createPlayerHandouts ? `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}` : "";
        linkReplaces.push({ html: aNode.outerHTML, ref: playerText });
        if (config.v10Mode) {
          document.text.content = document.text.content.replace(aNode.outerHTML, playerText);
        } else {
          document.content = document.content.replace(aNode.outerHTML, playerText);
        }
        journals.push(journalEntry);
      }
      if (config.v10Mode ? !sceneImgMatched.includes(journalEntry.pages[0].src) : !sceneImgMatched.includes(journalEntry.img)) {
        scenes.push(generateScene(row, config.v10Mode ? journalEntry.pages[0].src : journalEntry.img));
      }
    });
  }

  possibleUnknownPlayerLinks.forEach((node) => {
    if (sceneImgMatched.includes(node.href)) return;
    if (!node.textContent.toLowerCase().includes("player")) return;

    tmpCount++;
    if (config.debug) {
      logger.verbose(node.outerHTML);
    }

    let title = `${document.name} (Player Version)`;

    const parentId = node.parentElement.getAttribute("data-content-chunk-id");
    const nodeId = node.getAttribute("data-content-chunk-id");
    const contentChunkId = parentId
      ? parentId
      : nodeId
        ? nodeId
        : `${document.flags.ddb.ddbId}-${document.flags.ddb.parentId}-${tmpCount}-${document.flags.ddb.slug}`.replace("#","-");

    let row = {
      title: title,
      id: 14000 + document.flags.ddb.ddbId + tmpCount,
      parentId: document.flags.ddb.parentId,
      cobaltId: document.flags.ddb.cobaltId,
      documentName: document.name,
      sceneName: utils.titleString(document.name),
      contentChunkId: contentChunkId,
      slug: document.flags.ddb.slug,
      originDocId: document._id,
      originHint: "possibleUnknownPlayerLinks, player",
      originalLink: node.href,
      player: true,
    };
    const journalEntry = generateJournalEntry(row, node.href.replace("ddb://image", "."));

    // don't add entry if we have already parsed this
    if (!journalEntry.flags.ddb.duplicate) {
      const playerText = config.createPlayerHandouts ? `@JournalEntry[${journalEntry.flags.ddb.linkName}]{Player Version}` : "";
      linkReplaces.push( {html: node.outerHTML, ref: playerText });
      if (config.v10Mode) {
        document.text.content = document.text.content.replace(node.outerHTML, playerText);
      } else {
        document.content = document.content.replace(node.outerHTML, playerText);
      }
      journals.push(journalEntry);
    }
    if (config.v10Mode ? !sceneImgMatched.includes(journalEntry.pages[0].src) : !sceneImgMatched.includes(journalEntry.img)) {
      scenes.push(generateScene(row, config.v10Mode ? journalEntry.pages[0].src : journalEntry.img));
    }
  });

  if (config.createHandouts) {
    possibleHandouts.forEach((node) => {
      if(!node.src) return;
      tmpCount++;
      if (config.debug) {
        logger.verbose(node.outerHTML);
      }

      let title = `Handout ${unknownHandoutCount}`;

      let row = {
        title: title,
        id: 12000 + document.flags.ddb.ddbId + tmpCount,
        parentId: document.flags.ddb.parentId,
        cobaltId: document.flags.ddb.cobaltId,
        contentChunkId: node.getAttribute("data-content-chunk-id"),
        slug: document.flags.ddb.slug,
        originDocId: document._id,
        originHint: "possibleHandouts",
        originalLink: node.src,
      };
      const journalEntry = generateJournalEntry(row, node.src);
      if (!journalEntry.flags.ddb.duplicate) {
        unknownHandoutCount++;
        const linkId = journalEntry.flags.ddb.linkId ? journalEntry.flags.ddb.linkId : journalEntry._id;
        linkReplaces.push( {html: node.parentNode.outerHTML, ref: `${node.parentNode.outerHTML} @JournalEntry[${linkId}]{${title}}` });
        // document.content = document.content.replace(node.parentNode.outerHTML, `${node.parentNode.outerHTML} @JournalEntry[${journalEntry.flags.ddb.linkId}]{${title}}`);
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
    if (!row.title || row.title == "") {
      const frag = new JSDOM(row.html);
      row.title = frag.window.document.body.textContent;
    }
    logger.info(`Generating ${row.title}`);
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

  logger.info("Exporting adventure outline...");

  const adventure = require(path.join(templateDir,"adventure.json"));
  adventure.name = config.run.book.description;
  adventure.id = utils.randomString(10, "#aA");
  adventure.required = config.run.required;

  const adventureData = JSON.stringify(adventure);
  fs.writeFileSync(path.join(config.run.outputDir,"adventure.json"), adventureData);
}

function outputJournals(parsedChapters, config) {
  logger.info("Exporting journal chapters...");

  // journals out
  parsedChapters.forEach((chapter) => {
    const journalEntry = JSON.stringify(chapter);
    fs.writeFileSync(path.join(config.run.outputDir,"journal",`${chapter._id}.json`), journalEntry);
  });
}

function outputScenes(parsedScenes, config) {
  logger.info("Exporting scenes...");

  // scenes out
  parsedScenes.forEach((scene) => {
    const sceneContent = JSON.stringify(scene);
    fs.writeFileSync(path.join(config.run.outputDir,"scene",`${scene._id}.json`), sceneContent);
  });
}


function outputTables(parsedTables, config) {
  logger.info("Exporting tables...");

  // tables out
  parsedTables.forEach((table) => {
    const tableContent = JSON.stringify(table);
    fs.writeFileSync(path.join(config.run.outputDir,"table",`${table._id}.json`), tableContent);
  });
}

function hasFolderContent(parsedFolders, foldersWithContent, folder) {
  const hasContent = foldersWithContent.includes(folder._id);
  if (hasContent) return true;

  const childFolders = parsedFolders.filter((pFolder) => folder._id === pFolder.parent);
  if (!childFolders) return false;

  const hasChildrenWithContent = childFolders.some((childFolder) => foldersWithContent.includes(childFolder._id));
  if (hasChildrenWithContent) return true;

  const hasRecursiveContent = childFolders.some((childFolder) => hasFolderContent(parsedFolders, foldersWithContent, childFolder));

  return hasRecursiveContent;

}

function outputFolders(parsedFolders, config, content) {
  logger.info("Exporting required folders...");

  const foldersWithContent = parsedFolders.filter((folder) => content.some((content) =>
    folder._id === content.folder ||
    masterFolder[folder.type]._id == folder._id
  )).map((folder) => folder._id);

  const finalFolders = parsedFolders.filter((folder) => hasFolderContent(parsedFolders, foldersWithContent, folder));

  const foldersData = JSON.stringify(finalFolders);
  fs.writeFileSync(path.join(config.run.outputDir,"folders.json"), foldersData);
}


function generateZipFile(config) {
  logger.info("Generating adventure zip...");
  const zip = utils.getZipOfFolder(config.run.outputDir);
  utils.writeZipFile(zip, path.join(config.run.outputDirEnv,`${config.run.bookCode}.fvttadv`));
}

function rowGenerate(err, row) {
  if(err){
    logger.error("ERROR");
    logger.error(err);
    exit();
  }
  if (config.debug) {
    logger.debug("PARSING: " + row.id + ": " + row.title);
  }
  let document = generateJournalChapterEntry(row);
  generateNoteJournals(row);

  // if this is a top tier parent document we process it for scenes now.
  const content = config.v10Mode
    ? document.pages[0]
    : document;
  if (content && document.flags.ddb.cobaltId) {
    // eslint-disable-next-line no-unused-vars
    let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(content);
    replaceLinks = replaceLinks.concat(tmpReplaceLinks);
  } else {
    documents.push(document);
  }
  
}


async function downloadEnhancements(list) {
  logger.info("Checking for download enhancements...");
  const disableLargeDownloads = (config.disableLargeDownloads) ? 
    config.disableLargeDownloads :
    false;
  if (!disableLargeDownloads) {
    let dlFile = utils.loadFile(path.join(config.run.sourceDir, "hiRes.json"));
    let downloaded = dlFile ? JSON.parse(dlFile) : [];
    if (!Array.isArray(downloaded)) downloaded = [];
    for (let i = 0; i < list.length; i++) {
      const listPath = list[i].path.replace(/^assets\//, "");
      if (!downloaded.includes(listPath)) {
        const dlPath = path.join(config.run.sourceDir, listPath);
        logger.info(`Downloading Hi Res ${list[i].name} (${dlPath})`);
        await utils.downloadFile(list[i].url, dlPath, config.run.downloadTimeout);
        downloaded.push(listPath);
      }
    }
    utils.saveJSONFile(downloaded, path.join(config.run.sourceDir, "hiRes.json"));
  }
}

async function downloadDDBMobile() {
  logger.info("Checking for missing ddb images...");
  const targetFilesFile = utils.loadFile(path.join(config.run.sourceDir, "files.txt"));
  const targetFiles = targetFilesFile ? JSON.parse(targetFilesFile) : {};

  if (targetFiles.files) {
    const list = targetFiles.files;
    for (let i = 0; i < list.length; i++) {
      const localUrl = list[i].LocalUrl[0].replace(/^\//,"");
      const dlPath = path.join(config.run.sourceDir, localUrl);
      const isLocalFile = fs.existsSync(dlPath);
      if (!isLocalFile) {
        logger.info(`Downloading DDB Image ${localUrl} (${dlPath})`);
        await utils.downloadFile(list[i].RemoteUrl, dlPath, config.run.downloadTimeout);
        if (list[i].LocalUrl.length > 1) {
          for (let ui = 0; ui < list[i].LocalUrl.length; ui++) {
            const targetUrl = list[i].LocalUrl[ui].replace(/^\//,"");
            if (localUrl !== targetUrl) {
              logger.info(`Copying ${localUrl} to ${targetUrl}`);
              fse.copySync(dlPath, path.join(config.run.sourceDir,targetUrl));
            }
          }
        }
      }
    }
  }
}

function finalAssetCopy(config) {
  // To copy a folder or file
  fse.copySync(config.run.sourceDir, path.join(config.run.outputDir,"assets"));

  // copy assets files
  const assetFilePath = path.join(config.run.assetsInfoDir, config.run.bookCode);
  if (fs.existsSync(assetFilePath)) {
    fse.copySync(assetFilePath, path.join(config.run.outputDir,"assets"));
  }

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
}

async function collectionFinished(err, count) {
  logger.info("Data extraction complete document linking commencing...");
  if (err) {
    logger.error(err);
    exit();
  }
  try {
    if (global.gc) global.gc();
    logger.info(`Processing ${documents.length} scenes`);
    documents.forEach((document) => {
      if (document.content) {
        // eslint-disable-next-line no-unused-vars
        let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(document);
        replaceLinks = replaceLinks.concat(tmpReplaceLinks);
        if (global.gc) global.gc();
      } else if (document.pages) {
        document.pages.forEach((page) => {
          // eslint-disable-next-line no-unused-vars
          let [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(page);
          replaceLinks = replaceLinks.concat(tmpReplaceLinks);
          if (global.gc) global.gc();
        });
      }
    });

    logger.info(`Processing ${count} entries...`);
    logger.info("Looking for missing scenes...");
    [generatedJournals, generatedScenes] = generateMissingScenes(generatedJournals, generatedScenes);
    logger.info("Updating links...");
    generatedJournals = updateJournals(generatedJournals);
    logger.info("Fixing up tables...");
    [generatedTables, generatedJournals] = await fixUpTables(generatedTables, generatedJournals);
    logger.info("Complete! Generating output files...");
    outputAdventure(config);
    outputJournals(generatedJournals, config);
    logger.info("Generated Scenes:");
    logger.info(generatedScenes.map(s => `${s.name} : ${s._id} : ${s.flags.ddb.contentChunkId } : ${s.flags.ddb.ddbId } : ${s.flags.ddb.cobaltId } : ${s.flags.ddb.parentId } : ${s.img}`));
    outputScenes(generatedScenes, config);
    outputTables(generatedTables, config);
    const allContent = generatedJournals.concat(generatedScenes, generatedTables);
    outputFolders(generatedFolders, config, allContent);
    await downloadEnhancements(downloadList);
    await downloadDDBMobile(downloadList);
    finalAssetCopy(config);
    generateZipFile(config);
  } catch (err) {
    logger.error(`Error generating adventure: ${err}`);
    logger.error(err.stack);
  } finally {
    logger.info("Generated the following journal images:");
    logger.info(journalImgMatched);
    logger.info("Generated the following scene images:");
    logger.info(sceneImgMatched);
    // save generated Ids table
    configure.saveLookups(idTable);
    if (config.tableFind) {
      configure.saveTableData(tableMatched, config.run.bookCode);
    }
    if (config.imageFind) {
      configure.saveImageFinderResults(imageFinderSceneResults, imageFinderJournalResults, config.run.bookCode);
    }
    if (config.run.returnAdventure) {
      config.run.returnAdventure(config);
    }
  }
}

async function setConfig(conf) {
  config = conf;
  logger.info(`Adventure Muncher version ${config.run.version}`);
  logger.info(`Starting import of ${config.run.bookCode}`);
  masterFolder = undefined;
  documents = [];
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
  sceneAdjustments = sceneAdjuster.getSceneAdjustments(config, true);
  noteHints = noteHinter.getNoteHints(config);
  tableHints = tableHinter.getTableHints(config);
  enhancedScenes = await enhance.getEnhancedData(config);
  downloadList = [];
  logger.debug("Current config adjustments", {
    sceneAdjustments: sceneAdjustments.length,
    noteHints: noteHints.length,
    tableHints: tableHints.length,
    enhancedScenes: enhancedScenes.length,
  });
}

function getData(){

  const options = {
    readonly: true,
    fileMustExist: true,
  };
  const dbPath = path.join(config.run.sourceDir,`${config.run.bookCode}.db3`);
  const db = new sqlite3(dbPath, options);

  db.pragma("cipher='sqlcipher'");
  db.pragma("legacy=3");
  db.pragma(`key='${config.run.key}'`);
  db.pragma("cipher_page_size='1024'");
  db.pragma("kdf_iter='64000'");
  db.pragma("cipher_hmac_algorithm='HMAC_SHA1'");
  db.pragma("cipher_kdf_algorithm='PBKDF2_HMAC_SHA1'");

  logger.debug(db);

  try {
    const stmt = db.prepare(getAllSQL);
    const rows = stmt.all();

    for (const row of rows) {
      rowGenerate(null, row);
    }
    collectionFinished(null, stmt.length);

  } catch (err) {
    logger.error(err);
    logger.error(err.stack);
  }
  db.close();

}

function setMasterFolders() {
  masterFolder = {
    JournalEntry: generateFolder("JournalEntry", {id: -1, cobaltId: -1, title: config.run.book.description}, true),
    Scene: generateFolder("Scene", {id: -1, cobaltId: -1, title: config.run.book.description}, true),
    RollTable: generateFolder("RollTable", {id: -1, cobaltId: -1, title: config.run.book.description}, true),
    Actor: generateFolder("Actor", {id: -1, cobaltId: -1, title: config.run.book.description}, true),
  };
  logger.debug("Master Folders generated");
}

exports.setMasterFolders = setMasterFolders;
exports.setTemplateDir = setTemplateDir;
exports.getData = getData;
exports.setConfig = setConfig;
exports.fetchLookups = fetchLookups;
