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

// replaces matchAll, requires a non global regexp
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
    const group = map.get(prop) ?? [];

    group.push(item);
    map.set(prop, group);
  }

  return map;
}

function diceStringResultBuild (diceString, dice, bonus = "", mods = "", diceHint = "", specialFlags = "") {
  const globalDamageHints = config.useDamageHints ? config.useDamageHints : true;
  const resultBonus = bonus === 0 ? "" : `${bonus > 0 ? ' +' : ''} ${bonus}`;
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
    ].join('').trim(),
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
      rawSign = '+',
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

  const groupBySign = groupBy(dice, 'sign');
  for (const group of groupBySign.values()) {
    const groupByDie = groupBy(group, 'die');

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

  const diceString = endDice.map(({ sign, count, die }, index) => `${index ? sign : ''}${count}d${die}`).join(' ');

  const result = diceStringResultBuild(diceString, dice, bonus, mods, diceHint, specialFlags);
  return result;
}


function diceRollMatcher(match, p1, p2, p3, p4, p5) { 
  if (p5 && p5.toLowerCase() === "damage") {
    let dmgString = `${p4} damage`;
    dmgString = dmgString[0].toUpperCase() + dmgString.substring(1);
    const diceString = parseDiceString(p2, null, `[${p4.toLowerCase()}]`).diceString;
    return `${p1}[[/r ${diceString} # ${dmgString}]]${p3} damage`;
  } else if (p5 && p1 && p5.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
    const diceString = parseDiceString(p2, null, "[healing]").diceString;
    return `${p1}[[/r ${diceString} # Healing]]${p3} hit points`;
  } else {
    const diceString = parseDiceString(p2).diceString;
    return `${p1}[[/r ${diceString}]]${p3}`;
  }
}

function replaceRollLinks(text, conf) {
  if (!config) config = conf;

  text = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  const diceRegex = new RegExp(/([.>( ^]|^|regains +)?(\d*d\d+(?:\s*[+-]\s*\d*d*\d*)*)([.,<)]|$| +) *([a-z,A-Z]*) *(damage|points)?/, "g");
  text = text.replace(diceRegex, diceRollMatcher);
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
