/* eslint-disable no-useless-escape */
"use strict";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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

function foundryCompendiumReplace(text, config) {
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

  const ddbLinks = dom.window.document.querySelectorAll("a[href*=\"ddb://compendium\/\"]");
  const bookSlugRegExp = new RegExp("\"ddb:\/\/compendium\/(\\w+)(?:\/)?([\\w0-9\-._#+@/]*)\"");

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
  });

  // vehicles - not yet handled
  const compendiumLinks = dom.window.document.querySelectorAll("a[href*=\"ddb://vehicles\/\"]");
  const lookupRegExp = new RegExp("ddb:\/\/vehicles\/([0-9]*)");
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

function moduleReplaceLinks(text, journals, config) {
  const dom = new JSDOM(text);
  const fragmentLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  text = dom.window.document.body.innerHTML;

  const bookSlugRegExp = new RegExp(`ddb:\/\/compendium\/${config.run.bookCode}\/([\\w0-9\-._#+@/]*)`);

  fragmentLinks.forEach((node) => {
    const slugMatch = node.outerHTML.match(bookSlugRegExp);
    if (slugMatch) {
      // console.log(slugMatch);
      const slug = slugMatch[1].replace(/\//g, "").split("#");
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
  });

  const headerLinks = dom.window.document.querySelectorAll("a[href^=\"#\"");
  headerLinks.forEach((node) => {
    text = text.replace(node.outerHTML, node.textContent);
  });

  return text;
}

function replaceImageLinks(text, config) {
  // e.g. href="ddb://compendium/mm" to https://www.dndbeyond.com/sources/mm
  // e.g. href="ddb://compendium/this one to relevant compendium/folder
  // e.g. href="ddb://image/idrotf/" to "./idrotf/
  // ddb://compendium/idrotf/appendix-d-magic to it's own entry
  //let match = /ddb:\/\/(?!spells)([a-zA-z0-9\.\/#-])"/g;
  let match = /ddb:\/\/(?!vehicles|armor|actions|weaponproperties|compendium|image|spells|magicitems|monsters|skills|senses|conditions|weapons|adventuring-gear)([\w\d\.\/#-]+)+(?:"|')/gi;
  let matches = text.match(match);
  if (matches) {
    console.log("Unknown DDB Match");
    console.log(matches);
  }

  // todo generate a journal entry for each of these?
  // replace the start with adventure:// - this will be changed wither by adventure importer or an update in DDB
  const reImage = new RegExp(`src="\.\/${config.run.bookCode}\/`, "g");
  // text = text.replace(reImage, `src="adventure://assets/`);
  text = text.replace(reImage, "src=\"assets/");

  // "ddb://image/idrotf/"
  // <a class="ddb-lightbox-outer compendium-image-center"  href="ddb://image/idrotf/00-000.intro-splash.jpg" data-lightbox="1" data-title="">
  // <img src="./idrotf/00-000.intro-splash.jpg" class="ddb-lightbox-inner" style="width: 650px;"></a>
  const reImageLink = new RegExp(`href="ddb:\/\/image\/${config.run.bookCode}\/`, "g");
  // text = text.replace(reImageLink, `href="adventure://assets/`);
  text = text.replace(reImageLink, "href=\"assets/");
  return text;
}


function replaceImgLinksForJournal(text, config) {
  const reImage = new RegExp(`^\.\/${config.run.bookCode}\/`, "g");
  text = text.replace(reImage, "assets/");
  const reImage2 = new RegExp(`^${config.run.bookCode}\/`, "g");
  text = text.replace(reImage2, "assets/");

  return text;
}

function replaceRollLinks(text) {
  const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)([\s.,<])/, "g");
  text = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(diceRegex, "[[/r $1]]$3");
  return text;
}

function addClasses(text) {
  const dom = new JSDOM(text);
  let body = dom.window.document.body;
  const blockquotes = body.getElementsByTagName("blockquote");
  for(var i = 0, all = blockquotes.length; i < all; i++) {
    blockquotes[i].classList.add("ddb");
  }
  const h4 = body.getElementsByTagName("H4");
  for(var i = 0, all = h4.length; i < all; i++) {
    h4[i].classList.add("ddb");
  }
  const h5 = body.getElementsByTagName("H5");
  for(var i = 0, all = h5.length; i < all; i++) {
    h5[i].classList.add("ddb");
  }

  text = body.innerHTML;
  return text;
}


exports.foundryCompendiumReplace = foundryCompendiumReplace;
exports.replaceImgLinksForJournal = replaceImgLinksForJournal;
exports.replaceImageLinks = replaceImageLinks;
exports.replaceRollLinks = replaceRollLinks;
exports.moduleReplaceLinks = moduleReplaceLinks;
exports.addClasses = addClasses;
