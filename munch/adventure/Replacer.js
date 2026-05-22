/* eslint-disable no-useless-escape */
"use strict";

const logger = require("../logger.js");
const jsdom = require("jsdom");
const { Page } = require("./Journals/Page.js");
const { Helpers } = require("./Helpers.js");
const { JSDOM } = jsdom;

const COMPENDIUM_MAP = {
  // "skills": "skills",
  // "senses": "senses",
  // "conditions": "conditions",
  "spells": "spells",
  "magicitems": "items",
  "weapons": "items",
  "armor": "items",
  "adventuring-gear": "items",
  "monsters": "monsters",
  // "actions": "actions",
  // "weaponproperties": "weaponproperties",
  "vehicles": "vehicles",
};

const SQUARE_MAP = {
  "skills": "skills",
  "senses": "senses",
  "conditions": "conditions",
  // "spells": "spells",
  // "magicitems": "items",
  "actions": "actions",
};

// Helpers for string-based HTML manipulation (no JSDOM needed)
function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

function getAttr(tagHtml, attr) {
  const match = tagHtml.match(new RegExp(`${attr}="([^"]*)"`));
  return match ? match[1] : null;
}

function matchAnchors(html, hrefPattern) {
  const results = [];
  const regex = new RegExp(`<a\\s[^>]*?href="${hrefPattern}"[^>]*?>[\\s\\S]*?<\\/a>`, "gi");
  let match;
  while ((match = regex.exec(html)) !== null) {
    const outerHTML = match[0];
    const href = getAttr(outerHTML, "href");
    const innerStart = outerHTML.indexOf(">") + 1;
    const innerEnd = outerHTML.lastIndexOf("</a>");
    const innerHTML = outerHTML.substring(innerStart, innerEnd);
    results.push({ outerHTML, href, innerHTML, textContent: stripTags(innerHTML) });
  }
  return results;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


class DynamicLinkReplacer {

  constructor(adventure, { text, name = null, journal = null}) {
    this.adventure = adventure;
    this.name = name;
    this.html = text;
    this.journal = journal;
  }

  dispose() {
    this.html = null;
  }

  process({includeTables = true, includeImages = true} = {}) {
    logger.info(`Replacing links for ${this.name}`);
    if (this.adventure.return) this.adventure.returns.statusMessage(`Replacing links for ${this.name}`);
    if (includeImages) {
      logger.debug(`Replacing image links for ${this.name}`);
      this.replaceImageLinks();
    }
    logger.debug(`Linking module content for ${this.name}`);
    this.moduleReplaceLinks();
    logger.debug(`Linking ddb-importer compendium content for ${this.name}`);
    this.foundryCompendiumReplace();
    if (includeTables) {
      logger.debug("Updating with Table Links");
      this.replaceTables();
    }
  }

  get result() {
    return this.html;
  }

  get textContent() {
    return stripTags(this.html);
  }

  replaceTables() {
    this.adventure.tables.forEach((table) => {
      const chunkId = table.data.flags.ddb.contentChunkId;
      if (!chunkId) return;
      const tableRegex = new RegExp(
        `(<table[^>]*data-content-chunk-id="${escapeRegExp(chunkId)}"[^>]*>[\\s\\S]*?<\\/table>)`,
        "i"
      );
      const tableMatch = this.html.match(tableRegex);
      if (tableMatch) {
        logger.info(`Updating table reference for: ${table.data.name}`);
        this.html = this.html.replace(
          tableMatch[0],
          `${tableMatch[0]}<div id="table-link">@RollTable[${table.data.name}]{Open RollTable}</div>`
        );
      }
    });
  }

  moduleReplaceLinks() {
    const bookCode = this.adventure.bookCode;
    const bookSlugRegExp = new RegExp(`ddb:\\/\\/compendium\\/${escapeRegExp(bookCode)}\\/([\\w0-9\\-._#+@/]*)`);
    const anchors = matchAnchors(this.html, `ddb:\\/\\/compendium\\/${escapeRegExp(bookCode)}\\/[^"]*`);

    for (const anchor of anchors) {
      const slugMatch = anchor.outerHTML.match(bookSlugRegExp);
      if (slugMatch) {
        const slug = slugMatch[1].replace(/\//g, "").split("#");
        const slug0Ref = slug[0].split("-").filter((x) => x.trim() !== "").join("-").toLowerCase();
        const refactoredSlug = (slug.length > 1) ? `${slug0Ref}#${slug[1]}` : slug0Ref;
        const journalPageMap = this.adventure._allPagesFlat || this.adventure.journals.map((j) => j.data.pages).flat();
        const journalPage = journalPageMap.find((pageData) => {
          let check = pageData.flags.ddb.slug === refactoredSlug;
          if (!check && slug.length > 1) check = pageData.flags.ddb.slug === slug0Ref;
          const pageNameSlug = pageData.name.replace(/[^\w\d]+/g, "");
          const pageCheck = slug.length > 2
            ? !pageData.flags.ddb.img && !pageData.flags.ddb.note
              && pageNameSlug.toLowerCase() === slug[1].toLowerCase().replace(/[^\w\d]+/g, "")
            : true;
          return check && pageCheck;
        });
        if (journalPage) {
          const textPointer = anchor.textContent.trim() !== "";
          const textValue = anchor.textContent;
          const journalEntry = this.adventure._pageToJournal
            ? this.adventure._pageToJournal.get(journalPage._id)
            : this.adventure.journals.find((j) => j.data.pages.some((p) => p._id === journalPage._id));
          const slugLink = (slug.length > 2) ? `#${slug[2].replace(/[^\w\d]+/g, "")}` : "";
          const result = `@UUID[JournalEntry.${journalEntry.data._id}.JournalEntryPage.${journalPage._id}${slugLink}]${textPointer ? `{${textValue}}` : ""}`;
          this.html = this.html.replace(anchor.outerHTML, result);
        } else {
          logger.warn(`NO JOURNAL for "${anchor.outerHTML}" Slugs: "${slug}" Refactored slug: "${refactoredSlug} slug0Ref: "${slug0Ref}"`);
        }
      } else {
        logger.warn(`NO SLUGS FOR ${anchor.outerHTML}`);
      }
    }
  }

  foundryCompendiumReplace() {
    for (const lookupKey in COMPENDIUM_MAP) {
      const lookupRegExp = new RegExp(`ddb:\\/\\/${escapeRegExp(lookupKey)}\\/([0-9]*)`);
      const anchors = matchAnchors(this.html, `ddb:\\/\\/${escapeRegExp(lookupKey)}\\/[^"]*`);
      for (const anchor of anchors) {
        const lookupMatch = anchor.outerHTML.match(lookupRegExp);
        if (!lookupMatch) continue;
        const lookupValue = this.adventure.config.data.lookups[COMPENDIUM_MAP[lookupKey]];
        if (lookupValue) {
          if (!this.adventure.required[COMPENDIUM_MAP[lookupKey]].has(String(lookupMatch[1]))) {
            this.adventure.required[COMPENDIUM_MAP[lookupKey]].add(String(lookupMatch[1]));
          }
          const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
          if (lookupEntry) {
            const documentRef = lookupEntry._id ? lookupEntry._id : lookupEntry.documentName;
            const pageLink = lookupEntry.pageId ? `.JournalEntryPage.${lookupEntry.pageId}` : "";
            const linkStub = lookupEntry.headerLink ? `#${lookupEntry.headerLink}` : "";
            const link = `${lookupEntry.compendium}.${documentRef}${pageLink}${linkStub}`;
            const linkType = lookupEntry._id ? "UUID[Compendium." : "Compendium[";
            this.html = this.html.replace(anchor.outerHTML, `@${linkType}${link}]{${anchor.textContent}}`);
          }
        }
      }
    }

    for (const lookupKey in SQUARE_MAP) {
      const lookupRegExp = new RegExp(`ddb:\\/\\/${escapeRegExp(lookupKey)}\\/([0-9]*)`);
      const anchors = matchAnchors(this.html, `ddb:\\/\\/${escapeRegExp(lookupKey)}\\/[^"]*`);
      for (const anchor of anchors) {
        const lookupMatch = anchor.outerHTML.match(lookupRegExp);
        if (!lookupMatch) continue;
        const lookupValue = this.adventure.config.data.lookups[COMPENDIUM_MAP[lookupKey]];
        if (lookupValue) {
          if (!this.adventure.required[COMPENDIUM_MAP[lookupKey]].has(String(lookupMatch[1]))) {
            this.adventure.required[COMPENDIUM_MAP[lookupKey]].add(String(lookupMatch[1]));
          }
        }
      }
    }

    const bookSlugRegExp = new RegExp("href=\"ddb:\\/\\/compendium\\/([\\w-]+)([\\/\\#][\\w0-9\\-._#+@/]*)\"");
    const ddbAnchors = matchAnchors(this.html, "ddb:\\/\\/compendium\\/[^\"]*");
    for (const anchor of ddbAnchors) {
      const slugMatch = anchor.outerHTML.match(bookSlugRegExp);
      if (slugMatch) {
        const book = this.adventure.config.ddbConfig.sources.find((source) => source.name.toLowerCase() == slugMatch[1].toLowerCase());
        if (book) {
          const newHref = `https://www.dndbeyond.com/${book.sourceURL}${slugMatch[2]}`;
          const newAnchor = anchor.outerHTML.replace(`href="${anchor.href}"`, `href="${newHref}"`);
          this.html = this.html.replace(anchor.outerHTML, newAnchor);
        } else {
          logger.error(`Unknown book reference found ${slugMatch[1]} in ${slugMatch[0]}`);
        }
      }
    }
  }

  replaceImageLinks() {
    const reFileLink = new RegExp("href=\"ddb:\\/\\/file\\/" + escapeRegExp(this.adventure.bookCode) + "\\/(.*?)\"");
    const anchors = matchAnchors(this.html, "ddb:\\/\\/file\\/[^\"]*");

    for (const anchor of anchors) {
      const fileMatch = anchor.outerHTML.match(reFileLink);
      if (fileMatch) {
        this.adventure.otherFiles.push({ name: anchor.innerHTML, fileName: `assets/${fileMatch[1]}` });

        if (this.journal) {
          const pageData = {
            name: anchor.innerHTML,
            content: `assets/${fileMatch[1]}`,
            flags: this.journal.data.flags,
            id: Helpers.randomString(16,"#aA"),
            type: "pdf",
          };
          const page = new Page(pageData);
          this.journal.data.pages.push(page.toObject());
          const link = `@UUID[JournalEntry.${this.journal.data._id}.JournalEntryPage.${page.data._id}]`;
          this.html = this.html.replace(anchor.outerHTML, link);
        } else {
          const newAnchor = anchor.outerHTML.replace(`href="${anchor.href}"`, `href="assets/${fileMatch[1]}"`);
          this.html = this.html.replace(anchor.outerHTML, newAnchor);
        }

        logger.info("fileMatchTarget", {fileMatch, target: anchor.outerHTML, inner: anchor.innerHTML, outer: anchor.outerHTML});
      }
    }
  }

}

class StaticLinkReplacer {

  constructor(adventure, { text, name = null, journal = null}) {
    this.adventure = adventure;
    this.name = name;
    this.dom = new JSDOM(text).window.document;
    this.journal = journal;
  }
  
  // Clean up DOM to free memory
  dispose() {
    if (this.dom && this.dom.defaultView) {
      this.dom.defaultView.close();
    }
    this.dom = null;
  }

  process() {
    logger.info(`Replacing links for ${this.name}`);
    if (this.adventure.return) this.adventure.returns.statusMessage(`Replacing links for ${this.name}`);
    logger.debug(`Replacing image links for ${this.name}`);
    this.replaceImageLinks();
    logger.debug(`Linking module content for ${this.name}`);
    this.moduleReplaceLinks();
    logger.debug(`Linking ddb-importer compendium content for ${this.name}`);
    this.foundryCompendiumReplace();
    logger.debug(`Fixing up classes for ${this.name}`);
    this.addClasses();
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


  moduleReplaceLinks() {
    const h1Links = this.dom.querySelectorAll(`h1 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h2Links = this.dom.querySelectorAll(`h2 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h3Links = this.dom.querySelectorAll(`h3 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h4Links = this.dom.querySelectorAll(`h4 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const h5Links = this.dom.querySelectorAll(`h5 a[href*=\"ddb://compendium\/${this.adventure.bookCode}"]`);
    const hLinks = [h1Links, h2Links, h3Links, h4Links, h5Links];
    const replacements = [];
    
    hLinks.forEach((hLink) => {
      for (let headerIndex = 0, headerLength = hLink.length; headerIndex < headerLength; headerIndex++) {
        const node = hLink[headerIndex];
        replacements.push({
          oldText: node.outerHTML,
          newText: node.textContent
        });
      }
    });

    const headerLinks = this.dom.querySelectorAll("a[href^=\"#\"");
    for (let headerIndex = 0, headerLength = headerLinks.length; headerIndex < headerLength; headerIndex++) {
      const node = headerLinks[headerIndex];
      replacements.push({
        oldText: node.outerHTML,
        newText: node.textContent
      });
    }
    
    // Batch all innerHTML replacements
    if (replacements.length > 0) {
      let html = this.dom.body.innerHTML;
      for (const replacement of replacements) {
        html = html.replace(replacement.oldText, replacement.newText);
      }
      this.dom.body.innerHTML = html;
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

    const lookupReplacements = [];

    for (const lookupKey in COMPENDIUM_MAP) {
      const compendiumLinks = this.dom.querySelectorAll(`a[href*=\"ddb://${lookupKey}\/\"]`);
      const lookupRegExp = new RegExp(`ddb:\/\/${lookupKey}\/([0-9]*)`);
      compendiumLinks.forEach((node) => {
        const lookupMatch = node.outerHTML.match(lookupRegExp);
        const lookupValue = this.adventure.config.data.lookups[COMPENDIUM_MAP[lookupKey]];
        if (lookupValue) {
          if (!this.adventure.required[COMPENDIUM_MAP[lookupKey]].has(String(lookupMatch[1]))) {
            this.adventure.required[COMPENDIUM_MAP[lookupKey]].add(String(lookupMatch[1]));
          }
          const lookupEntry = lookupValue.find((e) => e.id == lookupMatch[1]);
          if (lookupEntry) {
            const documentRef = lookupEntry._id ? lookupEntry._id : lookupEntry.documentName;
            const pageLink = lookupEntry.pageId ? `.JournalEntryPage.${lookupEntry.pageId}` : "";
            const linkStub = lookupEntry.headerLink ? `#${lookupEntry.headerLink}` : "";
            const link = `${lookupEntry.compendium}.${documentRef}${pageLink}${linkStub}`;
            const linkType = lookupEntry._id ? "UUID[Compendium." : "Compendium[";
            lookupReplacements.push({
              oldText: node.outerHTML,
              newText: `@${linkType}${link}]{${node.textContent}}`
            });
          }
        } 
      });
    }

    // Batch all innerHTML replacements
    if (lookupReplacements.length > 0) {
      let html = this.dom.body.innerHTML;
      for (const replacement of lookupReplacements) {
        html = html.replace(replacement.oldText, replacement.newText);
      }
      this.dom.body.innerHTML = html;
    }

    const otherReplacements = [];
    const ddbLinks = this.dom.querySelectorAll("a[href*=\"ddb://compendium\/\"]");
    const bookSlugRegExp = new RegExp("\"ddb:\/\/compendium\/([\\w-]+)([\/#][\\w0-9\-._#+@/]*)\"");

    // text = text.replace(compendiumReg, "https://www.dndbeyond.com/sources/");
    // 'ddb://compendium/idrotf/aurils',
    // 'ddb://compendium/idrotf/doom',
    ddbLinks.forEach((node) => {
      const target = node.outerHTML;
      const slugMatch = node.outerHTML.match(bookSlugRegExp);
      if (slugMatch && slugMatch[1].toLowerCase() !== this.adventure.bookCode.toLowerCase()) {
        // logger.info(slugMatch);
        const book = this.adventure.config.ddbConfig.sources.find((source) => source.name.toLowerCase() == slugMatch[1].toLowerCase());
        if (book) {
          node.setAttribute("href", `https://www.dndbeyond.com/${book.sourceURL}${slugMatch[2]}`);
          otherReplacements.push({
            oldText: target,
            newText: node.outerHTML
          });
        } else {
          logger.error(`Unknown book reference found ${slugMatch[1]} in ${slugMatch[0]}`);
        }
      }
    });

    // Batch all innerHTML replacements
    if (otherReplacements.length > 0) {
      let html = this.dom.body.innerHTML;
      for (const replacement of otherReplacements) {
        html = html.replace(replacement.oldText, replacement.newText);
      }
      this.dom.body.innerHTML = html;
    }
  }

  replaceImageLinks() {
    // e.g. href="ddb://compendium/mm" to https://www.dndbeyond.com/sources/mm
    // e.g. href="ddb://compendium/this one to relevant compendium/folder
    // e.g. href="ddb://image/idrotf/" to "./idrotf/
    // ddb://compendium/idrotf/appendix-d-magic to it's own entry
    //let match = /ddb:\/\/(?!spells)([a-zA-z0-9\.\/#-])"/g;
    const match = /ddb:\/\/(?!vehicles|armor|actions|weaponproperties|compendium|image|spells|magicitems|monsters|skills|senses|conditions|weapons|file|adventuring-gear)([\w\d\.\/#-]+)+(?:"|')/gi;
    const matches = this.dom.body.innerHTML.match(match);
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
    const reFileLink = new RegExp(`href="ddb:\/\/file\/${this.adventure.bookCode}\/(.*?)"`);
    const fileLinks = this.dom.querySelectorAll("a[href*=\"ddb://file\/\"]");
    const fileReplacements = [];

    fileLinks.forEach((node) =>{
      const target = `${node.outerHTML}`;
      const fileMatch = node.outerHTML.match(reFileLink);
      if (fileMatch) {
        if ((/(\.jpg|\.jpeg|\.gif|\.webp|\.webm|\.png)"/i).test(fileMatch[1].trim())) {
          node.removeAttribute("href");
          fileReplacements.push({
            oldText: target,
            newText: node.innerHTML
          });
        } else {
          node.setAttribute("href", `assets/${fileMatch[1]}`);
          fileReplacements.push({
            oldText: target,
            newText: node.outerHTML
          });
        }
      }
    });
    
    // Batch all file link replacements
    if (fileReplacements.length > 0) {
      let html = this.dom.body.innerHTML;
      for (const replacement of fileReplacements) {
        html = html.replace(replacement.oldText, replacement.newText);
      }
      this.dom.body.innerHTML = html;
    }
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
    // const globalDamageHints = this.adventure.config.data.useDamageHints ? this.adventure.config.data.useDamageHints : true;
    const globalDamageHints = false;
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
      const sign = rawSign === "" ? "+" : rawSign.slice(-1);
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


  static diceRollMatcher(match, p1, p2, p3, p4, p5, p6) { 
    if (p6 && p6.toLowerCase() === "damage") {
      const diceString = DiceReplacer.parseDiceString(p3, null, `[${p5.toLowerCase().trim()}]`).diceString;
      return `${p1 ? p1: ""} [[/damage ${diceString} ${p5.toLowerCase().trim()} average=true]] damage`;
    } else if (p6 && p1 && p6.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
      const diceString = DiceReplacer.parseDiceString(p3, null, "[healing]").diceString;
      return `${p1 ? p1: ""} [[/damage ${diceString} type=heal average=false]] hit points`;
    } else {
      const diceString = DiceReplacer.parseDiceString(p3).diceString;
      // const rollString = `${p1 ? p1: ""} [[/roll ${diceString}]]${p3 ? p3 : ""}${p4 ? p4 : ""} ${p5 ? p5 : ""} `;
      const rollString = `${p1 ? p1: ""} [[/damage ${diceString} ${p5 ? p5.toLowerCase().trim() : ""}]] ${p6 ? p6 : ""}`;
      const result = rollString
        .replace("( [[/roll ", "([[/roll ")
        .replace("> [[/roll", ">[[/roll")
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
    const damageRegex = new RegExp(/(Hit:|[.>(^\s]|^|regains)+(?:([0-9]+))?(?: *\(([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)?)\))(<|[.,<)$\s])+?(\s?[a-z,A-Z]+)\s*(damage|points)?/, "ig");
    this.text = this.text.replace(damageRegex, DiceReplacer.diceRollMatcher);
    
    // to hit rolls
    const toHitRegex = new RegExp(/ ([+-]) *(\d+) to hit/, "g");
    this.text = this.text.replace(toHitRegex, " [[/roll 1d20 $1 $2]] to hit");
  }
}

exports.StaticLinkReplacer = StaticLinkReplacer;
exports.DiceReplacer = DiceReplacer;
exports.DynamicLinkReplacer = DynamicLinkReplacer;
