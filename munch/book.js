const utils = require("./utils.js");
const { getAllSQL } = require("./sql.js");
const fs = require('fs');
const path = require("path");
const { exit, domain } = require("process");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require('@journeyapps/sqlcipher').verbose();
const _ = require('lodash');
const configure = require("./config.js");
const sceneAdjuster = require("./scene-load.js");

var journalSort = 1000;
var folderSort = 4000;
var config;
var idTable;
var sceneAdjustments;
var imgMatched = [];

var masterFolder;

let chapters = [];
let folders = [];
let scenes = [];

var templateDir = path.join("..", "content", "templates");

let imageFinderResults = [];

function setTemplateDir (dir) {
  templateDir = dir;
}

function fetchLookups (config) {
  idTable = configure.getLookups();
  if (!idTable[config.run.bookCode]) idTable[config.run.bookCode] = [];
}


const COMPENDIUM_MAP = {
  "skills": "skills",
  "senses": "senses",
  "conditions": "conditions",
  "spells": "spells",
  "magicitems": "items",
  "weapons": "items",
  "armor": "items",
  "adventuring-gear": "items",
  "monsters": "monsters",
  "actions": "actions",
  "weaponproperties": "weaponproperties",
};


function getId(document, docType) {
  const existingId = idTable[config.run.bookCode].find((r) =>
    r.type == document.type &&
    r.docType == docType &&
    r.ddbId == document.flags.ddb.ddbId &&
    r.cobaltId === document.flags.ddb.cobaltId &&
    r.parentId === document.flags.ddb.parentId
  );
  if (existingId) {
    if (existingId.name != document.name) {
      existingId.name = document.name;
      const index = _.findIndex(idTable[config.run.bookCode], {id: existingId.id});
      idTable[config.run.bookCode].splice(index, 1, existingId);
    }
    return existingId.id;
  } else {
    const id = {
      id: `${utils.randomString(16,"#aA")}`,
      type: document.type,
      docType: docType,
      ddbId: document.flags.ddb.ddbId,
      cobaltId: document.flags.ddb.cobaltId,
      parentId: document.flags.ddb.parentId,
      name: document.name,
    };
    idTable[config.run.bookCode].push(id);
    return id.id;
  }
}


function foundryCompendiumReplace(text) {
  // replace the ddb:// entries with known compendium look ups if we have them
  // ddb://spells
  // ddb://magicitems || weapons || adventuring-gear || armor
  // ddb://monsters
  // skills
  // senses
  // conditions
  // armor
  // actions
  // weaponproperties

  const dom = new JSDOM(text);
  text = dom.window.document.body.outerHTML;

  for (const lookupKey in COMPENDIUM_MAP) {
    const compendiumLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://${lookupKey}\/\"]`);
    const lookupRegExp = new RegExp(`ddb:\/\/${lookupKey}\/([0-9]*)`);
    compendiumLinks.forEach((node) => {
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      const lookupValue = config.lookups[COMPENDIUM_MAP[lookupKey]];
      if (lookupValue) {
        const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
        if (lookupEntry) {
          text = text.replace(node.outerHTML, `@Compendium[${lookupEntry.compendium}.${lookupEntry._id}]{${node.textContent}}`);
        } else {
          console.log(`NO Lookup Compendium Entry for ${node.outerHTML}`);
        }
      }
    });
  }

  const ddbLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://compendium\/\"]`);
  const bookSlugRegExp = new RegExp(`\"ddb:\/\/compendium\/(\\w+)(?:\/)?([\\w0-9\-._#+@/]*)\"`);

  // text = text.replace(compendiumReg, "https://www.dndbeyond.com/sources/");
  // 'ddb://compendium/idrotf/aurils',
  // 'ddb://compendium/idrotf/doom',
  ddbLinks.forEach((node) => {
    const target = node.outerHTML;
    const slugMatch = node.outerHTML.match(bookSlugRegExp);
    if (slugMatch) {
      // console.log(slugMatch);
      node.setAttribute("href", `https://www.dndbeyond.com/sources/${slugMatch[1]}/${slugMatch[2]}`);
      text = text.replace(target, node.outerHTML);
    }
  })

  // vehicles - not yet handled
  const compendiumLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://vehicles\/\"]`);
  const lookupRegExp = new RegExp(`ddb:\/\/vehicles\/([0-9]*)`);
  compendiumLinks.forEach((node) => {
    const target = node.outerHTML;
    const lookupMatch = node.outerHTML.match(lookupRegExp);
    const lookupValue = config.lookups["vehicles"];
    if (lookupMatch) {
      const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
      if (lookupEntry) {
        node.setAttribute("href", `https://www.dndbeyond.com${lookupEntry.url}`);
        text = text.replace(target, node.outerHTML);
      } else {
        console.log(`NO Vehicle Lookup Entry for ${node.outerHTML}`);
      }
    } else {
      console.log(`NO Vehicle Lookup Match for ${node.outerHTML}`);
    }
  });


  // ddb://compendium/br (basic rule)
  return text;
}

function moduleReplaceLinks(text, journals) {
  const dom = new JSDOM(text);
  const fragmentLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  text = dom.window.document.body.outerHTML;

  const bookSlugRegExp = new RegExp(`ddb:\/\/compendium\/${config.run.bookCode}\/([\\w0-9\-._#+@/]*)`);

  fragmentLinks.forEach((node) => {
    const slugMatch = node.outerHTML.match(bookSlugRegExp);
    if (slugMatch) {
      // console.log(slugMatch);
      const slug = slugMatch[1].replace(/\//g, "").split('#');
      const refactoredSlug = (slug.length > 1) ? `${slug[0].toLowerCase()}#${slug[1]}` : slug[0].toLowerCase();
      const journalEntry = journals.find((journal) => {
        let check = journal.flags.ddb.slug === refactoredSlug;
        if (!check && slug.length > 1) check = journal.flags.ddb.slug === slug[0].toLowerCase();
        return check;
      });
      if (journalEntry) {
        // const journalRegex = new RegExp(`${node.outerHTML}`, "g");
        //text = text.replace(journalRegex, `@JournalEntry[${journalEntry.name}]{${node.textContent}}`);
        text = text.replace(node.outerHTML, `@JournalEntry[${journalEntry.name}]{${node.textContent}}`);
      } else {
        console.log(`NO JOURNAL for ${node.outerHTML}`);
      }
    } else {
      console.log(`NO SLUGS FOR ${node.outerHTML}`);
    }
  })

  const headerLinks = dom.window.document.querySelectorAll("a[href^=\"#\"");
  headerLinks.forEach((node) => {
    text = text.replace(node.outerHTML, node.textContent);
  });

  return text;
}

function replaceImageLinks(text) {
  let newEntries = [];
  // e.g. href="ddb://compendium/mm" to https://www.dndbeyond.com/sources/mm
  // e.g. href="ddb://compendium/this one to relevant compendium/folder
  // e.g. href="ddb://image/idrotf/" to "./idrotf/
  // ddb://compendium/idrotf/appendix-d-magic to it's own entry
  //let match = /ddb:\/\/(?!spells)([a-zA-z0-9\.\/#-])"/g;
  let match = /ddb:\/\/(?!vehicles|armor|actions|weaponproperties|compendium|image|spells|magicitems|monsters|skills|senses|conditions|weapons|adventuring-gear)([\w\d\.\/#-]+)+(?:"|')/gi
  let matches = text.match(match);
  if (matches) {
    console.log("Unknown DDB Match");
    console.log(matches);
  }

  // todo generate a journal entry for each of these?
  // replace the start with adventure:// - this will be changed wither by adventure importer or an update in DDB
  reImage = new RegExp(`src="\.\/${config.run.bookCode}\/`, "g");
  // text = text.replace(reImage, `src="adventure://assets/`);
  text = text.replace(reImage, `src="assets/`);

  // "ddb://image/idrotf/"
  // <a class="ddb-lightbox-outer compendium-image-center"  href="ddb://image/idrotf/00-000.intro-splash.jpg" data-lightbox="1" data-title="">
  // <img src="./idrotf/00-000.intro-splash.jpg" class="ddb-lightbox-inner" style="width: 650px;"></a>
  reImageLink = new RegExp(`href="ddb:\/\/image\/${config.run.bookCode}\/`, "g");
  // text = text.replace(reImageLink, `href="adventure://assets/`);
  text = text.replace(reImageLink, `href="assets/`);
  return [text, newEntries];
}


function replaceImgLinksForJournal(text) {
  reImage = new RegExp(`^\.\/${config.run.bookCode}\/`, "g");
  text = text.replace(reImage, `assets/`);
  reImage2 = new RegExp(`^${config.run.bookCode}\/`, "g");
  text = text.replace(reImage2, `assets/`);

  return text;
}

function updateJournals(documents) {
  let newEntries = [];
  let scenes = [];
  let replaceLinks = [];
  documents.forEach((entry) => {
    if (entry.content) {
      let sceneJournals = [];
      let tempScenes = [];
      let tmpReplaceLinks = [];
      // we only generate scenes for top level sections, these have the snippets
      // contained within at this point, so we get duplicates otherwise
      if (entry.flags.ddb.cobaltId) [tempScenes, sceneJournals, tmpReplaceLinks] = findScenes(entry);
      replaceLinks = replaceLinks.concat(tmpReplaceLinks);
      newEntries = newEntries.concat(sceneJournals);
      scenes = scenes.concat(tempScenes);
    }
  });
  // console.log(replaceLinks);

  let replaceEntries = [];
  // console.log(replaceLinks);
  documents = documents.concat(newEntries).map((doc) => {
    let replaceJournals = [];
    if (doc.content) {
      console.log(`Replacing content for ${doc.name}`);
      replaceLinks.forEach((link) => {
        doc.content = doc.content.replace(link.html, link.ref);
      });
      [doc.content, replaceJournals] = replaceImageLinks(doc.content);
      replaceEntries = replaceEntries.concat(replaceJournals);
    }
    return doc;
  })

  documents = documents.concat(replaceEntries).map((doc) => {
    if (doc.content) {
      console.log(`Linking module content for ${doc.name}`);
      doc.content = moduleReplaceLinks(doc.content, documents);
      console.log(`Linking ddb-importer compendium content for ${doc.name}`);
      doc.content = foundryCompendiumReplace(doc.content);
    }
    return doc;
  })

  return [documents, scenes];
}

function generateFolder(type, row, baseFolder=false, img=false) {
  const folder = JSON.parse(JSON.stringify(require(path.join(templateDir,"folder.json"))));
  folder.flags.ddb.ddbId = row.id;
  folder.flags.ddb.img = img;
  folder.name = row.title;
  folder.type = type;
  folder.sort = folderSort + parseInt(row.id);
  if (row.cobaltId && !baseFolder) {
    folder.parent = masterFolder[type]._id;
  }
  if (img) {
    folder.name = `[Handouts] ${folder.name}`;
    let parent;
    if (row.parentId) {
      parent = folders.find((f) => f.flags.ddb.parentId == row.parentId && f.type == type && !f.flags.ddb.img);
    } else if (row.cobaltId) {
      parent = folders.find((f) => f.flags.ddb.cobaltId == row.cobaltId && f.type == type && !f.flags.ddb.img);
      folder.sort = 1000000;
    }
    if (parent) {
      folder.parent = `${parent._id}`;
      folder.name = `[Handouts] ${parent.name}`;
    }
  } else if (row.parentId) {
    const parent = folders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && !f.flags.ddb.img);
    if (parent) {
      folder.parent = `${parent._id}`;
      folder.name = `[Sections] ${parent.name}`;
    }
    folder.flags.ddb.parentId = row.parentId;
  } else if(!baseFolder) {
    const parent = folders.find((f) => f.flags.ddb.cobaltId == -1 && f.type == type && !f.flags.ddb.img);
    if (parent) folder.parent = `${parent._id}`;
  }
  if (row.cobaltId) folder.flags.ddb.cobaltId = row.cobaltId;

  if (!folder.name) {
    console.log(folder)
    exit()
  }

  folder._id = getId(folder, "Folder");
  folder.flags.importid = folder._id;
  folders.push(folder);
  return folder;
}



function getFolderId(row, type, img) {
  let folderId;
  let folder;
  if (img) {
    if (row.cobaltId) {
      folder = folders.find((f) => f.flags.ddb.cobaltId == row.cobaltId && f.type == type && f.flags.ddb.img);
    } else {
      folder = folders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && f.flags.ddb.img);
    }
    if (!folder) {
      folder = generateFolder(type, row, false, img);
    }
    folderId = folder._id;
  } else if (row.cobaltId) {
    folder = folders.find((f) => f.flags.ddb.cobaltId == row.cobaltId && f.type == type && !f.flags.ddb.img);
    if (!folder) folder = generateFolder(type, row);
    folderId = folder._id;
    // return masterFolder[type]._id;
  } else if (row.parentId) {
    folder = folders.find((f) => f.flags.ddb.parentId == row.parentId && f.type == type && f.flags.ddb.img == img);
    if (!folder) folder = generateFolder(type, row);
    folderId = folder._id;
  } else {
    folder = folders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && f.flags.ddb.img == img);
    if (folder) folderId = folder._id;
  }
  return folderId;
}

function appendJournalToChapter(row) {
  if (row.parentId) {
    console.log(`${row.title} ${row.parentId} search...`)
    chapters.forEach((journal) => {
      if (journal.flags.ddb.cobaltId == row.parentId) {
        journal.content += row.html;
      }
    })
  }
}

function generateJournalEntry(row, img=null) {
  let journal = JSON.parse(JSON.stringify(require(path.join(templateDir,"journal.json"))));

  journal.name = row.title;
  journal.flags.ddb.ddbId = row.id;
  journal.flags.ddb.bookCode = config.run.bookCode;
  journal.flags.ddb.slug = row.slug;
  journal.flags.ddb.contentChunkId = row.contentChunkId;
  journal.flags.ddb.userData = config.run.userData;
  journal.sort = journalSort + parseInt(row.id);
  if (row.cobaltId) journal.flags.ddb.cobaltId = row.cobaltId;
  let imgState = (img !== null && img !== "") ? true : false;
  if (imgState) {
    journal.img = img;
  } else {
    const dom = new JSDOM(row.html);
    journal.content = dom.window.document.body.outerHTML.replace(/  /g, " ");
  }
  if (row.parentId) journal.flags.ddb.parentId = row.parentId;
  journal.folder = getFolderId(row, "JournalEntry", imgState);
  // console.log(row);
  // console.log(journal);
  // console.log(`${journal.name}, ${journal.folder}`);
  appendJournalToChapter(row);
  journal._id = getId(journal, "JournalEntry");
  chapters.push(journal);
  // console.log(`${journal._id} ${journal.name}`);
  return journal;
}

function generateScene(row, img) {
  let scene = JSON.parse(JSON.stringify(require(path.join(templateDir,"scene.json"))));

  scene.name = row.sceneName;
  scene.navName = row.sceneName.split(":").pop();
  scene.img = img;
  scene.flags.ddb.ddbId = row.id;
  scene.flags.ddb.bookCode = config.run.bookCode;
  scene.flags.ddb.slug = row.slug;
  scene.flags.ddb.contentChunkId = row.contentChunkId;
  scene.flags.ddb.userData = config.run.userData;
  scene.sort = journalSort + parseInt(row.id);
  if (row.cobaltId) scene.flags.ddb.cobaltId = row.cobaltId;
  if (row.parentId) {
    row.cobaltId = row.parentId;
    scene.flags.ddb.parentId = row.parentId;
    delete(row.parentId);
  };
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

  const adjustment = sceneAdjustments.find((s) => scene.name.includes(s.name));
  if (adjustment) {
    scene = _.merge(scene, adjustment);
  }

  scene._id = getId(scene, "Scene");

  if (config.imageFind) {
    imageFinderResults.push({
      bookCode: config.run.bookCode,
      img: scene.img,
      name: scene.name,
    });
  }

  scenes.push(scene);
  imgMatched.push(scene.img);
  console.log(`Added Scene ${scene.name}`);
  return scene;
}

function findScenes(document) {
  let scenes = [];
  let journals = [];
  let tmpCount = 0;
  let unknownHandoutCount = 1;
  // const frag = JSDOM.fragment(document.content);
  const frag = new JSDOM(document.content);
  document.content = frag.window.document.body.outerHTML;

  let linkReplaces = [];

  console.log(`Finding Scenes in ${document.name}`);
  if (config.debug) {
    console.log(`Finding Scenes in ${document.name.toUpperCase()}`);
  }
  // let possibleSceneNodes = frag.querySelectorAll("a[data-lightbox]");
  let possibleFigureSceneNodes = frag.window.document.body.querySelectorAll("figure");
  let possibleDivSceneNodes = frag.window.document.body.querySelectorAll("div.compendium-image-with-subtitle-center, div.compendium-image-with-subtitle-right, div.compendium-image-with-subtitle-left");
  let possibleHandouts = frag.window.document.body.querySelectorAll("img.ddb-lightbox-inner");
  let possibleViewPlayerScenes = frag.window.document.body.querySelectorAll("p.compendium-image-view-player");
  let possibleUnknownPlayerLinks = frag.window.document.body.querySelectorAll("a.ddb-lightbox-inner, a.ddb-lightbox-outer");

  if (config.debug) {
    console.log(possibleFigureSceneNodes.length);
    console.log(possibleDivSceneNodes.length);
    console.log(possibleHandouts.length);
    console.log(possibleViewPlayerScenes.length);
  }

  if (possibleFigureSceneNodes.length > 0) {
    possibleFigureSceneNodes.forEach((node) => {
      tmpCount++;
      if (config.debug) {
        console.log(node.outerHTML);
      }
      let caption = node.querySelector("figcaption");
      let img = node.querySelector("img");

      if (caption) {
        // console.log(document);
        let title = caption.textContent;
        const playerRef = node.querySelector("a[data-title~=Player]");
        if (playerRef) {
          title = title.replace(playerRef.textContent, "").trim();

          let row = {
            title: `${utils.titleString(title)} (Player Version)`,
            id: 10000 + document.flags.ddb.ddbId + tmpCount,
            parentId: document.flags.ddb.parentId,
            cobaltId: document.flags.ddb.cobaltId,
            documentName: document.name,
            sceneName: utils.titleString(title),
            contentChunkId: caption.getAttribute("data-content-chunk-id"),
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          playerEntry.img = replaceImgLinksForJournal(playerEntry.img);
          journals.push(playerEntry);
          linkReplaces.push( {html: playerRef.outerHTML, ref: `@JournalEntry[${title}]{DM Version} @JournalEntry[${row.title}]{Player Version}` });
          document.content = document.content.replace(playerRef.outerHTML, `@JournalEntry[${title}]{DM Version} @JournalEntry[${row.title}]{Player Version}`);
          scenes.push(generateScene(row, playerEntry.img));
        }

        let row = {
          title: title,
          id: 10000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: node.getAttribute("data-content-chunk-id"),
        };
        const journalEntry = generateJournalEntry(row, img.src);
        journalEntry.img = replaceImgLinksForJournal(journalEntry.img);
        journals.push(journalEntry);
      }
    });
  }

  if (possibleFigureSceneNodes.length == 0 && possibleDivSceneNodes.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleDivSceneNodes.forEach((node) => {
      tmpCount++;

      if (config.debug) {
        console.log(node.outerHTML);
      }
      let caption = node.querySelector("h3, h4");
      let img = node.querySelector("img");

      if (caption) {
        console.log(`Checking ${caption.textContent} for Scenes`)
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
          title = title.replace(playerRef.textContent, "").trim();

          let row = {
            title: `${utils.titleString(title)} (Player Version)`,
            id: 10000 + document.flags.ddb.ddbId + tmpCount,
            parentId: document.flags.ddb.parentId,
            cobaltId: document.flags.ddb.cobaltId,
            documentName: document.name,
            sceneName: utils.titleString(title),
            contentChunkId: (nextNode) ? nextNode.getAttribute("data-content-chunk-id") : undefined,
          };
          tmpCount++;
          const playerEntry = generateJournalEntry(row, playerRef.href.replace("ddb://image", "."));
          playerEntry.img = replaceImgLinksForJournal(playerEntry.img);
          journals.push(playerEntry);
          linkReplaces.push( {html: playerRef.outerHTML, ref: `@JournalEntry[${title}]{DM Version} @JournalEntry[${row.title}]{Player Version}` });
          document.content = document.content.replace(playerRef.outerHTML, `@JournalEntry[${title}]{DM Version} @JournalEntry[${row.title}]{Player Version}`);
          scenes.push(generateScene(row, playerEntry.img));
        } else {
          document.content = document.content.replace(img.outerHTML, `${img.outerHTML} @JournalEntry[${title}]{${title}}`);
        }

        let row = {
          title: title,
          id: 10000 + document.flags.ddb.ddbId + tmpCount,
          parentId: document.flags.ddb.parentId,
          cobaltId: document.flags.ddb.cobaltId,
          contentChunkId: caption.getAttribute("data-content-chunk-id"),
        };
        const journalEntry = generateJournalEntry(row, img.src);
        journalEntry.img = replaceImgLinksForJournal(journalEntry.img);
        journals.push(journalEntry);
      }
    });
  }
  if (possibleFigureSceneNodes.length == 0 && possibleHandouts.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleHandouts.forEach((node) => {
      tmpCount++;
      if (config.debug) {
        console.log(node.outerHTML);
      }

      let title = `Handout ${unknownHandoutCount}`;
      unknownHandoutCount++;
      document.content = document.content.replace(node.parentNode.outerHTML, `${node.parentNode.outerHTML} @JournalEntry[${title}]{${title}}`);

      let row = {
        title: title,
        id: 10000 + document.flags.ddb.ddbId + tmpCount,
        parentId: document.flags.ddb.parentId,
        cobaltId: document.flags.ddb.cobaltId,
        contentChunkId: node.getAttribute("data-content-chunk-id"),
      };
      const journalEntry = generateJournalEntry(row, node.src);
      journalEntry.img = replaceImgLinksForJournal(journalEntry.img);
      journals.push(journalEntry);
    });
  }
  if (possibleFigureSceneNodes.length == 0 && possibleViewPlayerScenes.length > 0) {
    // old style adventures don't have figure tags, hard parse
    // compendium-image-with-subtitle-center
    possibleViewPlayerScenes.forEach((node) => {
      let aNode = node.querySelector("a.ddb-lightbox-outer");
      if (!aNode || aNode.length == 0) return; 
      if (imgMatched.includes(aNode.href) || imgMatched.includes(aNode.src)) return;

      tmpCount++;
      if (config.debug) {
        console.log(aNode.outerHTML);
      }

      let title = `${document.name} (Player Version)`;
      unknownHandoutCount++;
      document.content = document.content.replace(aNode.outerHTML, `@JournalEntry[${title}]{Player Version}`);

      let row = {
        title: title,
        id: 10000 + document.flags.ddb.ddbId + tmpCount,
        parentId: document.flags.ddb.parentId,
        cobaltId: document.flags.ddb.cobaltId,
        documentName: document.name,
        sceneName: utils.titleString(document.name),
        contentChunkId: node.getAttribute("data-content-chunk-id"),
      };
      const journalEntry = generateJournalEntry(row, aNode.href.replace("ddb://image", "."));
      journalEntry.img = replaceImgLinksForJournal(journalEntry.img);
      
      // don't add entry if we have already parsed this
      if (imgMatched.includes(journalEntry.img)) return;
      linkReplaces.push( {html: aNode.outerHTML, ref: `@JournalEntry[${title}]{Player Version}` });
      journals.push(journalEntry);
      scenes.push(generateScene(row, journalEntry.img));
    });
  }

  possibleUnknownPlayerLinks.forEach((node) => {
    if (imgMatched.includes(node.href)) return;
    if (!node.textContent.toLowerCase().includes("player")) return;

    tmpCount++;
    if (config.debug) {
      console.log(node.outerHTML);
    }

    let title = `${document.name} (Player Version)`;
    unknownHandoutCount++;
    document.content = document.content.replace(node.outerHTML, `@JournalEntry[${title}]{Player Version}`);

    let row = {
      title: title,
      id: 10000 + document.flags.ddb.ddbId + tmpCount,
      parentId: document.flags.ddb.parentId,
      cobaltId: document.flags.ddb.cobaltId,
      documentName: document.name,
      sceneName: utils.titleString(document.name),
      contentChunkId: node.parentElement.getAttribute("data-content-chunk-id"),
    };
    const journalEntry = generateJournalEntry(row, node.href.replace("ddb://image", "."));
    journalEntry.img = replaceImgLinksForJournal(journalEntry.img);

    // don't add entry if we have already parsed this
    if (imgMatched.includes(journalEntry.img)) return;
    journals.push(journalEntry);
    linkReplaces.push( {html: node.outerHTML, ref: `@JournalEntry[${title}]{Player Version}` });
    scenes.push(generateScene(row, journalEntry.img));
  });

  console.log(imgMatched);

  return [scenes, journals, linkReplaces];
}


function generateJournalChapterEntry(row, img=null) {
  const existingJournal = chapters.find((f) => f.flags.ddb.ddbId == row.id);
  if (!existingJournal){
    const journal = generateJournalEntry(row, img);
    return journal;
  }
}

function outputAdventure(config) {
  if (!fs.existsSync(config.run.outputDir)) {
    fs.mkdirSync(config.run.outputDir);
  }

  config.subDirs.forEach((d) => {
    if (!fs.existsSync(path.join(config.run.outputDir,d))) {
      fs.mkdirSync(path.join(config.run.outputDir,d));
    }
  })

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
  console.log("Generating adventure zip...")
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
  generateJournalChapterEntry(row);
}

function collectionFinished(err, count) {
  if (err) {
    console.error(err);
    exit();
  }
  try {
    console.log(`Processing ${count} entries...`);
    [chapters, scenes] = updateJournals(chapters);
    outputAdventure(config);
    outputJournals(chapters, config);
    outputScenes(scenes, config);
    const allContent = chapters.concat(scenes);
    outputFolders(folders, config, allContent);
    generateZipFile(config);
  } catch (err) {
    console.log(`Error generating adventure: ${err}`);
    console.log(err.stack);
  } finally {
    // save generated Ids table
    configure.saveLookups(idTable);
    configure.saveImageFinderResults(imageFinderResults, config.run.bookCode);
  }
}

function setConfig(conf) {
  config = conf;
  masterFolder = undefined;
  chapters = [];
  folders = [];
  scenes = [];
  imageFinderResults = [];
  imgMatched = [];
  fetchLookups(config);
  sceneAdjustments = sceneAdjuster.getSceneAdjustments(config.run.bookCode);
}

function getData(){
  var db = new sqlite3.Database(
    path.join(config.run.sourceDir,`${config.run.bookCode}.db3`),
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) console.log(err);
  });

  db.serialize(function() {
    db.run("PRAGMA cipher_compatibility = 3")
    db.run(`PRAGMA key = '${config.key[config.run.bookCode]}'`)
    db.run("PRAGMA cipher_page_size = '1024'")
    db.run("PRAGMA kdf_iter = '64000'")
    db.run("PRAGMA cipher_hmac_algorithm = 'HMAC_SHA1'")
    db.run("PRAGMA cipher_kdf_algorithm = 'PBKDF2_HMAC_SHA1'")

    // generate chapter journal entries
    db.each(getAllSQL, rowGenerate, collectionFinished);
  });

  db.close();
}

function setMasterFolders() {
  masterFolder = {
    JournalEntry: generateFolder("JournalEntry", {id: -1, cobaltId: -1, title: config.run.book}, true),
    Scene: generateFolder("Scene", {id: -1, cobaltId: -1, title: config.run.book}, true),
    // Table: generateFolder("Table", {id: -1, cobaltId: -1, title: config.run.book}, true),
  };
}

exports.setMasterFolders = setMasterFolders;
exports.setTemplateDir = setTemplateDir;
exports.getData = getData;
exports.setConfig = setConfig;
exports.fetchLookups = fetchLookups;
