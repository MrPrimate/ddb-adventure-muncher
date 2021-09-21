/* eslint-disable no-useless-escape */
"use strict";

const logger = require("./logger.js");
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

var config;

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

  // add to config.run.required to import missing items in ddbimporter
  // config.run.required = {
  //   monsters: [],
  //   items: [],
  //   spells: [],
  //   vehicles: [],
  //   skills: [],
  //   senses: [],
  //   conditions: [],
  //   actions: [],
  //   weaponproperties: [],
  // };

  const dom = new JSDOM(text);
  text = dom.window.document.body.outerHTML;

  for (const lookupKey in COMPENDIUM_MAP) {
    const compendiumLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://${lookupKey}\/\"]`);
    const lookupRegExp = new RegExp(`ddb:\/\/${lookupKey}\/([0-9]*)`);
    compendiumLinks.forEach((node) => {
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      const lookupValue = config.lookups[COMPENDIUM_MAP[lookupKey]];
      if (lookupValue) {
        if (!config.run.required[COMPENDIUM_MAP[lookupKey]].includes(String(lookupMatch[1]))) {
          config.run.required[COMPENDIUM_MAP[lookupKey]].push(String(lookupMatch[1]));
        }

        const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
        if (lookupEntry) {
          const documentRef = lookupEntry.documentName ? lookupEntry.documentName : lookupEntry._id;
          text = text.replace(node.outerHTML, `@Compendium[${lookupEntry.compendium}.${documentRef}]{${node.textContent}}`);
        } else {
          logger.info(`No Lookup Compendium Entry for ${node.textContent} with ID ${lookupMatch[1]}. DDB Importer will attempt to import this during adventure load.`);
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
      // logger.info(slugMatch);
      const book = config.run.ddb_config.sources.find((source) => source.name.toLowerCase() == slugMatch[1].toLowerCase());
      if (book) {
        node.setAttribute("href", `https://www.dndbeyond.com/${book.sourceURL}/${slugMatch[2]}`);
        text = text.replace(target, node.outerHTML);
      } else {
        logger.error(`Unknown book reference found ${slugMatch[1]} in ${slugMatch[0]}`);
      }
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
      if (!config.run.required["vehicles"].some((e) => e.id == lookupMatch[1])) {
        config.run.required["vehicles"].push(lookupMatch[1]);
      }
      const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
      if (lookupEntry) {
        node.setAttribute("href", `https://www.dndbeyond.com${lookupEntry.url}`);
        text = text.replace(target, node.outerHTML);
      } else {
        logger.info(`NO Vehicle Lookup Entry for ${node.outerHTML}`);
      }
    } else {
      logger.info(`NO Vehicle Lookup Match for ${node.outerHTML}`);
    }
  });


  // ddb://compendium/br (basic rule)
  return text;
}

function moduleReplaceLinks(text, journals, config) {
  const dom = new JSDOM(text);

  const bookSlugRegExp = new RegExp(`ddb:\/\/compendium\/${config.run.bookCode}\/([\\w0-9\-._#+@/]*)`);
  let innerHTML = dom.window.document.body.innerHTML;

  const h1Links = dom.window.document.querySelectorAll(`h1 a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  const h2Links = dom.window.document.querySelectorAll(`h2 a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  const h3Links = dom.window.document.querySelectorAll(`h3 a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  const h4Links = dom.window.document.querySelectorAll(`h4 a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);
  const hLinks = [h1Links, h2Links, h3Links, h4Links];
  hLinks.forEach((hLink) => {
    for (let headerIndex = 0, headerLength = hLink.length; headerIndex < headerLength; headerIndex++) {
      const node = hLink[headerIndex];
      innerHTML = innerHTML.replace(node.outerHTML, node.textContent);
    }
  });

  const fragmentLinks = dom.window.document.querySelectorAll(`a[href*=\"ddb://compendium\/${config.run.bookCode}"]`);

  for (let fragmentIndex = 0, fragmentsLength = fragmentLinks.length; fragmentIndex < fragmentsLength; fragmentIndex++) {
    const node = fragmentLinks[fragmentIndex];

    const slugMatch = node.outerHTML.match(bookSlugRegExp);
    if (slugMatch) {
      // logger.info(slugMatch);
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
        innerHTML = innerHTML.replace(node.outerHTML, `@JournalEntry[${journalEntry.name}]{${node.textContent}}`);
      } else {
        logger.info(`NO JOURNAL for ${node.outerHTML}`);
      }
    } else {
      logger.info(`NO SLUGS FOR ${node.outerHTML}`);
    }
  }


  const headerLinks = dom.window.document.querySelectorAll("a[href^=\"#\"");
  for (let headerIndex = 0, headerLength = headerLinks.length; headerIndex < headerLength; headerIndex++) {
    const node = headerLinks[headerIndex];
    innerHTML = innerHTML.replace(node.outerHTML, node.textContent);
  }

  return innerHTML;
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
    logger.info("Unknown DDB Match");
    logger.info(matches);
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

// replaces matchAll, requires a non global regexp
// eslint-disable-next-line no-unused-vars
function reMatchAll(regexp, string) {
  const matches = string.match(new RegExp(regexp, "gm"));
  if (matches) {
    let start = 0;
    return matches.map((group0) => {
      const match = group0.match(regexp);
      match.index = string.indexOf(group0, start);
      start = match.index;
      return match;
    });
  }
  return matches;
}

function groupBy(arr, property) {
  const map = new Map();

  for (const item of arr) {
    const prop = item[property];
    const mapProp = map.get(prop);
    const group = mapProp ? mapProp : [];

    group.push(item);
    map.set(prop, group);
  }

  return map;
}

function diceStringResultBuild (diceString, dice, bonus = "", mods = "", diceHint = "", specialFlags = "") {
  const globalDamageHints = config.useDamageHints ? config.useDamageHints : true;
  const resultBonus = bonus === 0 ? "" : `${bonus > 0 ? " +" : ""} ${bonus}`;
  const diceHintAdd = globalDamageHints && diceHint && diceString && diceString !== "";

  const result = {
    dice: dice,
    diceMapped: diceString,
    bonus: bonus,
    diceString: [
      diceString,
      specialFlags,
      (diceHintAdd ? `${diceHint}` : ""),
      mods,
      resultBonus
    ].join("").trim(),
  };
  return result;
}

function parseDiceString (inStr, mods = "", diceHint = "", specialFlags = "") {
  // sanitizing possible inputs a bit
  const str = `${inStr}`.toLowerCase().replace(/[–-–−]/gu, "-").replace(/\s+/gu, "");

  // all found dice strings, e.g. 1d8, 4d6
  let dice = [];
  // all bonuses, e.g. -1+8
  let bonuses = [];

  const diceRegex = /(?<rawSign>[+-]*)(?<count>\d*)(?:d(?<die>\d+))?/gu;

  for (const { groups } of str.matchAll(diceRegex)) {
    const {
      rawSign = "+",
      count = 0,
      die
    } = groups;

    // sign. We only take the sign standing exactly in front of the dice string
    // so +-1d8 => -1d8. Just as a failsave
    const sign = rawSign.slice(-1);
    const parsedCount = parseInt(sign + count);

    if (die) {
      const dieCount = isNaN(parsedCount) ? 1 : count;
      dice.push({
        sign,
        count: parseInt(sign + dieCount),
        die: parseInt(die)
      });
    } else if (!isNaN(parsedCount)) {
      bonuses.push({
        sign,
        count: parsedCount
      });
    }
  }

  // sum up the bonus
  const bonus = bonuses.reduce((prev, cur) => prev + cur.count, 0);

  // group the dice, so that all the same dice are summed up if they have the same sign
  // e.g.
  // +1d8+2d8 => 3d8
  // +1d8-2d8 => +1d8 -2d8 will remain as-is
  const endDice = [];

  const groupBySign = groupBy(dice, "sign");
  for (const group of groupBySign.values()) {
    const groupByDie = groupBy(group, "die");

    for (const dieGroup of groupByDie.values()) {
      endDice.push(
        dieGroup.reduce((acc, item) => ({
          ...acc,
          count: acc.count + item.count
        }))
      );
    }
  }

  endDice.sort((a, b) => {
    if (a.die < b.die) return -1;
    if (a.die > b.die) return 1;
    if (a.sign === b.sign) {
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      return 0;
    } else {
      return a.sign === "+" ? -1 : 1;
    }
  });

  const diceString = endDice.map(({ sign, count, die }, index) => `${index ? sign : ""}${count}d${die}`).join(" ");

  const result = diceStringResultBuild(diceString, dice, bonus, mods, diceHint, specialFlags);
  return result;
}


function diceRollMatcher(match, p1, p2, p3, p4, p5) { 
  if (p5 && p5.toLowerCase() === "damage") {
    let dmgString = `${p4} damage`;
    dmgString = dmgString[0].toUpperCase() + dmgString.substring(1);
    const diceString = parseDiceString(p2, null, `[${p4.toLowerCase()}]`).diceString;
    return `${p1 ? p1: ""}[[/r ${diceString} # ${dmgString}]]${p3} damage`;
  } else if (p5 && p1 && p5.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
    const diceString = parseDiceString(p2, null, "[healing]").diceString;
    return `${p1 ? p1: ""}[[/r ${diceString} # Healing]]${p3} hit points`;
  } else {
    const diceString = parseDiceString(p2).diceString;
    // logger.info(match);
    // logger.info(`p1: ${p1}`);
    // logger.info(`p2: ${p2}`);
    // logger.info(`p3: ${p3}`);
    // logger.info(`p4: ${p4}`);
    // logger.info(`p5: ${p5}`);
    const result = `${p1 ? p1: ""}[[/r ${diceString}]]${p3 ? p3 : ""} ${p4 ? p4 : ""} ${p5 ? p5 : ""}`.trim();
    // logger.info(result);
    return result;
  }
}

function replaceRollLinks(text, conf) {
  if (!config) config = conf;

  text = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  const damageRegex = new RegExp(/([.>( ^]|^|regains +)?(\d*d\d+(?:\s*[+-]\s*\d*d*\d*)*)([.,<)]|$| +) *([a-z,A-Z]*) *(damage|points)?/, "g");
  text = text.replace(damageRegex, diceRollMatcher);

  // const Regex
  // to hit rolls
  const toHitRegex = new RegExp(/ ([+-]) *(\d+) to hit/, "g");
  text = text.replace(toHitRegex, " [[/r 1d20 $1 $2]] to hit");
  return text;
}

function addClasses(text) {
  const dom = new JSDOM(text).window.document;

  const blockquotes = dom.getElementsByTagName("blockquote");
  for (let i = 0; i < blockquotes.length; i++) {
    blockquotes[i].classList.add("ddb-blockquote");
  }
  const h4 = dom.getElementsByTagName("H4");
  for (let j = 0; j < h4.length; j++) {
    h4[j].classList.add("ddb-book-header");
  }
  const h5 = dom.getElementsByTagName("H5");
  for (let k = 0; k < h5.length; k++) {
    h5[k].classList.add("ddb-book-header");
  }

  return dom.body.innerHTML;
}


exports.foundryCompendiumReplace = foundryCompendiumReplace;
exports.replaceImgLinksForJournal = replaceImgLinksForJournal;
exports.replaceImageLinks = replaceImageLinks;
exports.replaceRollLinks = replaceRollLinks;
exports.moduleReplaceLinks = moduleReplaceLinks;
exports.addClasses = addClasses;
