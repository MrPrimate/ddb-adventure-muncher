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
  "vehicles": "vehicles",
};

class LinkReplacer {

  constructor(adventure, text, name = null) {
    this.adventure = adventure;
    this.name = name;
    this.dom = JSDOM(text).window.document;
  }

  process() {
    logger.info(`Replacing links for ${this.name}`);
    logger.debug(`Replacing image links for ${this.name}`);
    this.replaceImageLinks();
    logger.debug(`Linking module content for ${this.name}`);
    this.moduleReplaceLinks();
    logger.debug(`Linking ddb-importer compendium content for ${this.name}`);
    this.foundryCompendiumReplace();
    logger.debug(`Fixing up classes for ${this.name}`);
    this.addClasses();
    logger.debug(`Updating Journal with Table Links`);
    this.replaceTables();
  }

  get result() {
    return this.dom.body.innerHTML;
  }

  get textContent() {
    return this.dom.body.textContent;
  }

  addClasses() {
    const blockquotes = this.dom.getElementsByTagName("blockquote");
    for (let i = 0; i < blockquotes.length; i++) {
      blockquotes[i].classList.add("ddb-blockquote");
    }
    const h4 = this.dom.getElementsByTagName("H4");
    for (let j = 0; j < h4.length; j++) {
      h4[j].classList.add("ddb-book-header");
    }
    const h5 = this.dom.getElementsByTagName("H5");
    for (let k = 0; k < h5.length; k++) {
      h5[k].classList.add("ddb-book-header");
    }
  }

  replaceTables() {
    this.adventure.tables.forEach((table) => {
      const tablePoint = this.dom.querySelector(`table[data-content-chunk-id="${table.flags.ddb.contentChunkId}"]`);
      if (tablePoint) {
        logger.info(`Updating table reference for: ${table.name}`);
        tablePoint.insertAdjacentHTML("afterend", `<div id="table-link">@RollTable[${table.name}]{Open RollTable}</div>`);
      }
    });
  }


  moduleReplaceLinks() {
    const bookSlugRegExp = new RegExp(`ddb:\/\/compendium\/${this.adventure.bookCode}\/([\\w0-9\-._#+@/]*)`);

    const h1Links = this.dom.querySelectorAll(`h1 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h2Links = this.dom.querySelectorAll(`h2 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h3Links = this.dom.querySelectorAll(`h3 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h4Links = this.dom.querySelectorAll(`h4 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h5Links = this.dom.querySelectorAll(`h5 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const hLinks = [h1Links, h2Links, h3Links, h4Links, h5Links];
    hLinks.forEach((hLink) => {
      for (let headerIndex = 0, headerLength = hLink.length; headerIndex < headerLength; headerIndex++) {
        const node = hLink[headerIndex];
        this.dom.body.innerHTML = this.dom.body.innerHTML.replace(node.outerHTML, node.textContent);
      }
    });

    const fragmentLinks = this.dom.querySelectorAll(`a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);

    for (let fragmentIndex = 0, fragmentsLength = fragmentLinks.length; fragmentIndex < fragmentsLength; fragmentIndex++) {
      const node = fragmentLinks[fragmentIndex];

      const slugMatch = node.outerHTML.match(bookSlugRegExp);
      if (slugMatch) {
        // logger.info(slugMatch);
        const slug = slugMatch[1].replace(/\//g, "").split("#");
        const refactoredSlug = (slug.length > 1) ? `${slug[0].toLowerCase()}#${slug[1]}` : slug[0].toLowerCase();
        const journalPageMap = this.adventure.config.v10Mode ? this.adventure.journals.map((j) => j.pages).flat() : this.adventure.journals;
        const journalPage = journalPageMap.find((journalPage) => {
          let check = journalPage.flags.ddb.slug === refactoredSlug;
          if (!check && slug.length > 1) check = journalPage.flags.ddb.slug === slug[0].toLowerCase();
          const pageNameSlug = journalPage.name.replace(/[^\w\d]+/g, "");
          const pageCheck = this.adventure.config.v10Mode && slug.length > 2
            ? !journalPage.flags.ddb.img && !journalPage.flags.ddb.note &&
              pageNameSlug.toLowerCase() === slug[1].toLowerCase()
            : true;
          return check && pageCheck;
        });
        if (journalPage) {
          // const journalRegex = new RegExp(`${node.outerHTML}`, "g");
          //text = text.replace(journalRegex, `@JournalEntry[${journalEntry.name}]{${node.textContent}}`);
          const textPointer = node.textContent.trim() !== "";
          const textValue = `${node.textContent}`;
          if (this.adventure.config.v10Mode) {
            const journalEntry = this.adventure.journals.find((j) => j.pages.some((p) => p._id === journalPage._id));
            const slugLink = textPointer ? `#${textValue.replace(/\s/g, "")}` : "";
            this.dom.body.innerHTML = this.dom.body.innerHTML.replace(node.outerHTML, `@UUID[JournalEntry.${journalEntry._id}.JournalEntryPage.${journalPage._id}${slugLink}]${textPointer ? `{${textValue}}` : ""}`);
          } else {
            this.dom.body.innerHTML = this.dom.body.innerHTML.replace(node.outerHTML, `@JournalEntry[${journalPage.name}]${textPointer ? textValue : ""}`);
          }
          
        } else {
          logger.warn(`NO JOURNAL for "${node.outerHTML}" Slugs: "${slug}" Refactored slug: "${refactoredSlug}"`);
        }
      } else {
        logger.warn(`NO SLUGS FOR ${node.outerHTML}`);
      }
    }


    const headerLinks = this.dom.querySelectorAll("a[href^=\"#\"");
    for (let headerIndex = 0, headerLength = headerLinks.length; headerIndex < headerLength; headerIndex++) {
      const node = headerLinks[headerIndex];
      this.dom.body.innerHTML = this.dom.body.innerHTML.replace(node.outerHTML, node.textContent);
    }
  }

  foundryCompendiumReplace() {
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

    for (const lookupKey in COMPENDIUM_MAP) {
      const compendiumLinks = this.dom.querySelectorAll(`a[href*=\"ddb://${lookupKey}\/\"]`);
      const lookupRegExp = new RegExp(`ddb:\/\/${lookupKey}\/([0-9]*)`);
      compendiumLinks.forEach((node) => {
        const lookupMatch = node.outerHTML.match(lookupRegExp);
        const lookupValue = this.adventure.config.lookups[COMPENDIUM_MAP[lookupKey]];
        if (lookupValue) {
          if (!this.adventure.config.run.required[COMPENDIUM_MAP[lookupKey]].includes(String(lookupMatch[1]))) {
            this.adventure.config.run.required[COMPENDIUM_MAP[lookupKey]].push(String(lookupMatch[1]));
          }
  
          const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
          if (lookupEntry) {
            const documentRef = lookupEntry.documentName ? lookupEntry.documentName : lookupEntry._id;
            this.dom.body.innerHTML = this.dom.body.innerHTML.replace(node.outerHTML, `@Compendium[${lookupEntry.compendium}.${documentRef}]{${node.textContent}}`);
          }
        }
      });
    }
  
    const ddbLinks = this.dom.querySelectorAll("a[href*=\"ddb://compendium\/\"]");
    const bookSlugRegExp = new RegExp("\"ddb:\/\/compendium\/(\\w+)(?:\/)?([\\w0-9\-._#+@/]*)\"");
  
    // text = text.replace(compendiumReg, "https://www.dndbeyond.com/sources/");
    // 'ddb://compendium/idrotf/aurils',
    // 'ddb://compendium/idrotf/doom',
    ddbLinks.forEach((node) => {
      const target = node.outerHTML;
      const slugMatch = node.outerHTML.match(bookSlugRegExp);
      if (slugMatch) {
        // logger.info(slugMatch);
        const book = this.adventure.config.run.ddb_config.sources.find((source) => source.name.toLowerCase() == slugMatch[1].toLowerCase());
        if (book) {
          node.setAttribute("href", `https://www.dndbeyond.com/${book.sourceURL}/${slugMatch[2]}`);
          this.dom.body.innerHTML = this.dom.body.innerHTML.replace(target, node.outerHTML);
        } else {
          logger.error(`Unknown book reference found ${slugMatch[1]} in ${slugMatch[0]}`);
        }
      }
    });
  }

  replaceImageLinks() {
    // e.g. href="ddb://compendium/mm" to https://www.dndbeyond.com/sources/mm
    // e.g. href="ddb://compendium/this one to relevant compendium/folder
    // e.g. href="ddb://image/idrotf/" to "./idrotf/
    // ddb://compendium/idrotf/appendix-d-magic to it's own entry
    //let match = /ddb:\/\/(?!spells)([a-zA-z0-9\.\/#-])"/g;
    let match = /ddb:\/\/(?!vehicles|armor|actions|weaponproperties|compendium|image|spells|magicitems|monsters|skills|senses|conditions|weapons|adventuring-gear)([\w\d\.\/#-]+)+(?:"|')/gi;
    let matches = this.dom.body.innerHTML.match(match);
    if (matches) {
      logger.warn("Unknown DDB Match:", matches);
    }
  
    // todo generate a journal entry for each of these?
    // replace the start with adventure:// - this will be changed wither by adventure importer or an update in DDB
    const reImage = new RegExp(`src="\.\/${this.adventure.bookCode}\/`, "g");
    // text = text.replace(reImage, `src="adventure://assets/`);
    this.dom.body.innerHTML = this.dom.body.innerHTML.replace(reImage, "src=\"assets/");
  
    // "ddb://image/idrotf/"
    // <a class="ddb-lightbox-outer compendium-image-center"  href="ddb://image/idrotf/00-000.intro-splash.jpg" data-lightbox="1" data-title="">
    // <img src="./idrotf/00-000.intro-splash.jpg" class="ddb-lightbox-inner" style="width: 650px;"></a>
    const reImageLink = new RegExp(`href="ddb:\/\/image\/${this.adventure.bookCode}\/`, "g");
    // text = text.replace(reImageLink, `href="adventure://assets/`);
    this.dom.body.innerHTML = this.dom.body.innerHTML.replace(reImageLink, "href=\"assets/");
  }

}


class DiceReplacer {

  constructor(adventure, text, name = null) {
    this.adventure = adventure;
    this.name = name;
    this.text = text;
  }

  get result() {
    return this.text;
  }

  process() {
    logger.debug(`Generating dice rolls for ${this.name}`);
    this.replaceRollLinks();
  }

  static groupBy(arr, property) {
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

  static diceStringResultBuild (diceString, dice, bonus = "", mods = "", diceHint = "", specialFlags = "") {
    const globalDamageHints = this.adventure.config.useDamageHints ? this.adventure.config.useDamageHints : true;
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
  
  static parseDiceString (inStr, mods = "", diceHint = "", specialFlags = "") {
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
  
    const groupBySign = DiceReplacer.groupBy(dice, "sign");
    for (const group of groupBySign.values()) {
      const groupByDie = DiceReplacer.groupBy(group, "die");
  
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
  
    const result = DiceReplacer.diceStringResultBuild(diceString, dice, bonus, mods, diceHint, specialFlags);
    return result;
  }


  static diceRollMatcher(match, p1, p2, p3, p4, p5) { 
    if (p5 && p5.toLowerCase() === "damage") {
      let dmgString = `${p4} damage`;
      dmgString = dmgString[0].toUpperCase() + dmgString.substring(1);
      const diceString = DiceReplacer.parseDiceString(p2, null, `[${p4.toLowerCase().trim()}]`).diceString;
      return `${p1 ? p1: ""} [[/r ${diceString} # ${dmgString}]]${p3} ${p4} damage`;
    } else if (p5 && p1 && p5.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
      const diceString = DiceReplacer.parseDiceString(p2, null, "[healing]").diceString;
      return `${p1 ? p1: ""} [[/r ${diceString} # Healing]]${p3} hit points`;
    } else {
      const diceString = DiceReplacer.parseDiceString(p2).diceString;
      const rollString = `${p1 ? p1: ""} [[/r ${diceString}]]${p3 ? p3 : ""}${p4 ? p4 : ""} ${p5 ? p5 : ""} `;
      const result = rollString
        .replace("( [[/r ", "([[/r ")
        .replace("> [[/r", ">[[/r")
        .replace(/ {2}/g, " ")
        .replace(/^\(/, " (")
        .replace(/< $/, "<");
      // console.warn("diceroll", {
      //   match,
      //   p1,
      //   p2,
      //   p3,
      //   p4,
      //   p5,
      //   diceString,
      //   rollString,
      //   result,
      // });
      return result;
    }
  }

  replaceRollLinks() {
    this.text = this.text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
    const damageRegex = new RegExp(/([.>(^\s]|^|regains +)+(\d*d\d+(?:\s*[+-]\s*\d*d*\d*)*)( <|[.,<)$\s])+?(\s?[a-z,A-Z]*)\s*(damage|points)?/, "g");
    this.text = this.text.replace(damageRegex, DiceReplacer.diceRollMatcher);
  
    // to hit rolls
    const toHitRegex = new RegExp(/ ([+-]) *(\d+) to hit/, "g");
    this.text = this.text.replace(toHitRegex, " [[/r 1d20 $1 $2]] to hit");
  }
}

exports.LinkReplacer = LinkReplacer;
exports.DiceReplacer = DiceReplacer;