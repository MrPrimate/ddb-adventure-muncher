const logger = require("../../logger.js");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const sizeOf = require("image-size");
const { FileHelper } = require("../FileHelper.js");
const { Journal } = require("../Journals/Journal.js");

function unPad(match, p1) {
  if (isNaN(parseInt(p1))) {
    return p1;
  } else {
    return parseInt(p1);
  }
}

const BAD_WORDS = ["The", "At", "Who", "the"];

class Scene {

  get id() {
    return this.data._id;
  }

  generateIcon(title, defaultPath = undefined) {
    // default path
    let iconPath = defaultPath ? defaultPath : "icons/svg/book.svg";
    let stub = title.trim().split(".")[0].split(" ")[0].split(":")[0];
    stub = stub.replace(/(\d+)/, unPad);
    if (stub.length <= 4 && !BAD_WORDS.includes(stub)) {
      const svgDirPath = path.join(this.adventure.config.outputDir, "assets", "icons");
      iconPath = path.join("assets","icons",`${stub}.svg`);
      const iconFileOutPath = path.join(this.adventure.config.outputDir, iconPath);
      if (!fs.existsSync(svgDirPath)) fs.mkdirSync(svgDirPath);
      if (!fs.existsSync(iconFileOutPath)) {
        logger.info(stub);
        const svgTemplate = path.join(this.adventure.overrides.templateDir, `${stub.length}char.svg`);
        let svgContent = FileHelper.loadFile(svgTemplate);
        svgContent = svgContent.replace("REPLACEME", stub);
        FileHelper.saveFile(svgContent, iconFileOutPath);
      }
    }
    return iconPath.split(path.sep).join(path.posix.sep);
  }

  imageSize() {
    let size = {
      height: 2000,
      width: 2000,
    };
    if (fs.existsSync(this.imagePath)) {
      try {
        size = sizeOf(this.imagePath);
      } catch (e) {
        logger.error(`Error getting size of ${this.imagePath}`);
        logger.error(e.stack);
      }
    }
    return size;
  }

  #journalMatch() {
    let journalMatch = this.adventure.supports.pages
      ? this.adventure.journals.map((j) => j.data.pages).flat().find((journal) => journal._id === this.row.data.originDocId)
      : this.adventure.journals.find((journal) => journal.data._id === this.row.data.originDocId);
    if (!journalMatch) {
      journalMatch = this.adventure.supports.pages
        ? this.adventure.journals.map((j) => j.data.pages).flat().find((journalPage) => 
          journalPage.name.includes(this.data.navName)
          && !journalPage.flags.ddb.notes && !journalPage.flags.ddb.img && !journalPage.src
        )
        : this.adventure.journals.find((journal) => 
          journal.data.name.includes(this.data.navName)
          && !journal.data.flags.ddb.notes && !journal.data.flags.ddb.img && !journal.data.img
        );
    }
    if (journalMatch) this.data.journal = journalMatch._id;
  }

  linkNotes() {
    this.notes.forEach((note) => {
      logger.info(`Checking ${note.label}`);
      const noteJournal = this.adventure.config.data.createPinJournals || this.adventure.config.data.schemaVersion <= 4.1
        ? this.adventure.journals.find((journal) => {
          const contentChunkIdMatch = note.flags.ddb.contentChunkId
            ? journal.data.flags.ddb && note.flags.ddb && journal.data.flags.ddb.contentChunkId == note.flags.ddb.contentChunkId
            : false;

          const noContentChunk = !note.flags.ddb.contentChunkId
            && note.flags.ddb.originalLink && note.flags.ddb.ddbId && note.flags.ddb.parentId
            && note.flags.ddb.slug && note.flags.ddb.linkName;
          const originMatch = noContentChunk
            ? journal.data.flags.ddb.slug == note.flags.ddb.slug
            && journal.data.flags.ddb.ddbId == note.flags.ddb.ddbId
            && journal.data.flags.ddb.parentId == note.flags.ddb.parentId
            && journal.data.flags.ddb.cobaltId == note.flags.ddb.cobaltId
            && journal.data.flags.ddb.originalLink == note.flags.ddb.originalLink
            && journal.data.flags.ddb.linkName == note.flags.ddb.linkName
            : false;
          const journalNameMatch = !contentChunkIdMatch && !originMatch
            ? this.adventure.supports.pages
              ? journal.data.pages.some((page) => page.name.trim() === note.label.trim())
              : journal.data.name.trim() == note.label.trim()
            : false;
          return contentChunkIdMatch || originMatch || journalNameMatch;

        })
        : this.adventure.journals.find((journal) =>
          journal.data.flags.ddb.cobaltId == note.flags.ddb.parentId
        );
      if (noteJournal) {
        logger.info(`Found ${note.label} matched to ${noteJournal.data._id} (${noteJournal.data.name})`);
        note.positions.forEach((position) => {
          noteJournal.data.flags.ddb.pin = `${position.x}${position.y}`;
          const noteId = this.adventure.idFactory.getId(noteJournal.data, "Note");
          const n = {
            "_id": noteId,
            "flags": {
              "ddb": note.flags.ddb,
              "importid": noteId,
            },
            "entryId": noteJournal.data._id,
            "x": position.x,
            "y": position.y,
            "iconSize": note.iconSize ? note.iconSize : 40,
            "iconTint": "",
            "text": "",
            "fontFamily": note.fontFamily ? note.fontFamily : "Signika",
            "fontSize": note.fontSize ? note.fontSize : 48,
            "textAnchor": 1,
            "textColor": note.textColor ? note.textColor : "",
          };
          n.flags.ddb.linkName = noteJournal.data.flags.ddb.linkName;
          n.flags.ddb.slugLink = noteJournal.data.flags.ddb.slugLink;
          n.flags.ddb.linkId = noteId;
          // icon generation
          const icon = this.generateIcon(note.label, note.texture?.src);
          if (this.adventure.config.data.schemaVersion > 4.0) {
            n.texture = note.texture ?? {};
            n.texture.src = icon;
            if (!icon.startsWith("icons/svg")) {
              n.texture.rotation = 0;
              n.texture.tint= null;
            }
          } else {
            n.icon = icon;
          }

          if (!this.adventure.config.data.createPinJournals && this.adventure.config.data.schemaVersion >= 4.2) {
            n.flags.ddb.labelName = `${note.label}`; 
            // generate slug, and strip 0, support for native ddb sluging
            n.flags.ddb.slugLink = note.label.replace(/[^\w\d]+/g, "").replace(/^([a-zA-Z]?)0+/, "$1");
            // support for anchor links mondule
            n.flags.anchor = {
              slug: n.flags.ddb.slugLink
            };
            n.text = note.label;

            const contentChunkIdPageId = note.flags.ddb.contentChunkId
              ? noteJournal.getPageIdForContentChunkId(note.flags.ddb.contentChunkId)
              : undefined;
            const slugLinkPageId = noteJournal.getPageIdForElementId(n.flags.ddb.slugLink);

            // console.warn("MATCHES", { slugLinkPageId, contentChunkIdPageId, noteFlags: note.flags.ddb });
            // console.warn("PageIds", noteJournal.data.pages.map((p) => {return {id: p._id, flags: p.flags.ddb}}));
            const journalPage = noteJournal.data.pages.find((page) =>
              page.flags.ddb.parentId == note.flags.ddb.parentId
              && (page.flags.ddb.slug == note.flags.ddb.slug
              || page.flags.ddb.slug.replace(/^([a-zA-Z]?)0+/, "$1") == note.flags.ddb.slug
              || page.flags.ddb.slug.startsWith(note.flags.ddb.slug))
              && (page._id === contentChunkIdPageId || page._id === slugLinkPageId)
            );

            if (journalPage) {
              n.pageId = journalPage._id;
            } else {
              logger.error(`Unable to find journal page for note ${note.label}`, note);
              const idPage = noteJournal.data.pages.find((page) => page._id === contentChunkIdPageId || page._id === slugLinkPageId);
              this.adventure.bad.notes.push({
                noteLabel: note.label,
                noteFlags: note.flags.ddb,
                contentChunkIdPageId,
                slugLinkPageId,
                slug: note.flags.ddb.slug,
                parentId: note.flags.ddb.parentId,
                idPageFlags: idPage ? idPage.flags.ddb : "No page",
                nFlags: n.flags.ddb,
              });
            }
          }

          this.data.notes.push(n);
        });
      }
    });
  }

  // here we load adjustment data from ddb-meta-data
  // this is the magic that adds walls, actor positions and note data
  #adjustment() {

    // if a single adjustment that matches the contentCHunk, lets assume that's correct
    const contentChunkUnique = this.adventure.enhancements.sceneAdjustments.filter((s) =>
      this.data.flags.ddb.contentChunkId
      && this.data.flags.ddb.contentChunkId === s.flags.ddb.contentChunkId);
    
    let adjustment = contentChunkUnique.length > 0
      ? contentChunkUnique[0]
      // okay so not unique
      : (this.data.flags.ddb.contentChunkId)
        // try and fins a specific scene data
        ? this.adventure.enhancements.sceneAdjustments.find((s) =>
          (this.data.flags.ddb.contentChunkId === s.flags.ddb.contentChunkId
          && this.data.flags.ddb.ddbId == s.flags.ddb.ddbId
          && this.data.flags.ddb.parentId == s.flags.ddb.parentId
          && this.data.flags.ddb.cobaltId == s.flags.ddb.cobaltId)
          || (s.flags.ddb.alternateIds && s.flags.ddb.alternateIds.some((ai) =>
            this.data.flags.ddb.contentChunkId === ai.contentChunkId
            && this.data.flags.ddb.ddbId == ai.ddbId
            && this.data.flags.ddb.parentId == ai.parentId
            && this.data.flags.ddb.cobaltId == ai.cobaltId
          ))
        ) 
        // can't match on chunk, so lets try name
        : this.adventure.enhancements.sceneAdjustments.find((s) => this.data.name.includes(s.name));

    if (adjustment) {
      logger.info(`ADJUSTMENTS found named ${adjustment.name} with chunkid "${adjustment.flags.ddb.contentChunkId}" and id ${adjustment.flags.ddb.ddbId} for ${this.data.flags.ddb.ddbId}`);

      if (this.adventure.config.data.generateFixes && this.data.flags.ddb.ddbId == adjustment.flags.ddb.ddbId - 1) {
        logger.warn(`GENERATING SCENE ADJUSTMENT FIX for ${adjustment.name} ContentChunkId ${adjustment.flags.ddb.contentChunkId} with id: ${adjustment.flags.ddb.ddbId}`);
        const adjustmentCopy = JSON.parse(JSON.stringify(adjustment));
        adjustmentCopy.flags.ddb.ddbId = adjustment.flags.ddb.ddbId -1;
        this.adventure.sceneFactory.fixedAdjustments.push(adjustmentCopy);
      }

      if (adjustment.flags.ddb.tiles) {
        adjustment.tiles = adjustment.flags.ddb.tiles;
      }
      if (adjustment.flags.ddb.notes) {
        this.notes = adjustment.flags.ddb.notes;
      }
      // never include these adjustment fields they are probs bad
      delete adjustment.flags.ddb.notes;
      delete adjustment.flags.ddb.cobaltId;
      delete adjustment.flags.ddb.parentId;
      delete adjustment.flags.ddb.ddbId;
      delete adjustment.flags.ddb.contentChunkId;
      // mark as adjusted
      adjustment.flags.ddb["sceneAdjustment"] = true;
      logger.debug(adjustment.flags);
      logger.debug(this.data.flags);

      if (this.adventure.config.data.schemaVersion >= 4.0 && adjustment.background) {
        this.data.background = adjustment.background;
        this.data.image = `${this.data.image}`;
        delete this.data.image;
      }

      this.data = _.merge(this.data, adjustment);
    } else {
      logger.info(`NO ADJUSTMENTS found with chunkid "${this.data.flags.ddb.contentChunkId}" and id ${this.data.flags.ddb.ddbId}`);
    }
  }

  // this enriches with enhanced scene data
  #enhancedScenes() {
    const disableEnhancedDownloads = (this.adventure.config.disableEnhancedDownloads) 
      ? this.adventure.config.disableEnhancedDownloads
      : false;

    const enhancedScene = this.adventure.enhancements.sceneEnhancements.find((scene) => {
      const missingNameMatch = this.row.data.missing
        ? scene.missing && this.row.data.title === scene.name
        : true;
      return missingNameMatch 
        && scene.img === this.data.img
        && scene.bookCode === this.adventure.config.bookCode;
    });
    if (this.adventure.config.debug) logger.debug(enhancedScene);

    if (enhancedScene) {
      if (enhancedScene.adjustName && enhancedScene.adjustName.trim() != "") {
        this.data.name = enhancedScene.adjustName;
        this.data.navName = enhancedScene.adjustName;
      }
      if (enhancedScene.hiresImg && !disableEnhancedDownloads) {
        this.adventure.downloadList.push({name: this.data.name, url: enhancedScene.hiresImg, path: this.data.img });
      }
    }
  }

  // here we map any adjustment data tokens
  // we add a link to an actor id so we can use a single actor for multiple tokens
  #tokens() {
    if (this.data.flags.ddb.tokens && this.data.flags.ddb.tokens.length > 0) {
      this.data.tokens = this.data.flags.ddb.tokens
        .filter((token) => token.flags.ddbActorFlags && token.flags.ddbActorFlags.id)
        .map((token) => {
          const ddbId = token.flags.ddbActorFlags.id;
          const mockActor = {
            flags: {
              ddb: {
                contentChunkId: ddbId,
                ddbId: `DDB-Monster-${ddbId}`,
                cobaltId: null,
                parentId: null,
              },
            },
            type: "Actor",
          };

          token.actorId = this.adventure.idFactory.getId(mockActor, "Actor");
          token.flags.actorFolderId = this.adventure.folderFactory.masterFolders["Actor"]._id;
          logger.debug(`Found actor with Id ${ddbId}, actorId ${token.actorId}, folderId ${token.flags.actorFolderId}`);

          if (!this.adventure.required.monsters.has(String(ddbId))) {
            this.adventure.required.monsters.add(String(ddbId));
          }

          // these may have been gathered by accident
          delete token.bar2;
          delete token.displayName;
          return token;
        });
      // delete scene.flags.ddb.tokens;
    } else {
      this.data.tokens = [];
    }
  }

  #lights() {
    this.data.lights = this.data.lights.map((light) => {
      if (light.config?.darkness?.min > light.config?.darkness?.max) {
        light.config.darkness.max = light.config.darkness.min;
      }
      return light;
    });
  }

  constructor(adventure, row, image) {
    logger.info(`Generating Scene ${row.data.sceneName}`);
    if (adventure.returns) adventure.returns.statusMessage(`Generating Scene ${row.data.sceneName}`);
    this.adventure = adventure;
    this.row = row;
    this.image = image;
    this.notes = [];
    this.imagePath = path.join(this.adventure.config.outputDir, image);
    this.contentChunkId =  (row.data.contentChunkId && row.data.contentChunkId != "")
      ? row.data.contentChunkId
      : null;

    // load skeleton
    this.data = JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"scene.json"))));

    // initial image size guess (used if not set by adjustment)
    const dimensions = this.imageSize();
    this.data.width = dimensions.width;
    this.data.height = dimensions.height;

    this.data.name = row.data.sceneName;
    this.data.navName = row.data.sceneName.split(":").pop().trim();
    this.data.img = image;
    this.data.sort = Journal.JOURNAL_SORT + parseInt(row.data.id);

    // find matching journals and add
    this.#journalMatch();

    // set flags
    this.data.flags.ddb.documentName = row.data.documentName;
    this.data.flags.ddb.ddbId = row.data.id;
    this.data.flags.ddb.bookCode = this.adventure.config.bookCode;
    this.data.flags.ddb.slug = row.data.slug;
    this.data.flags.ddb.contentChunkId = this.contentChunkId;
    this.data.flags.ddb.userData = this.adventure.config.userData;
    this.data.flags.ddb.originDocId = row.data.originDocId;
    this.data.flags.ddb.originHint = row.data.originHint;
    this.data.flags.ddb.originalLink = row.data.originalLink;
    this.data.flags.ddb.versions = {
      "adventureMuncher": this.adventure.config.version
    };

    if (row.data.cobaltId) this.data.flags.ddb.cobaltId = row.data.cobaltId;
    if (row.data.parentId) {
      row.data.cobaltId = row.data.parentId;
      this.data.flags.ddb.parentId = row.data.parentId;
      delete row.data.parentId;
    }
    // row.data.title = row.data.documentName;
    this.data.folder = this.adventure.folderFactory.getFolderId(row, "Scene", "scene");

    // load meta-data adjustments
    this.#adjustment();

    // record this if we are recording scene information
    if (this.adventure.config.data.imageFind) {
      this.adventure.imageFinder.scenes.push({
        bookCode: this.adventure.bookCode,
        img: this.data.img,
        name: this.data.name,
        slug: row.data.slug,
        contentChunkId: this.contentChunkId,
        ddbId: this.data.flags.ddb.ddbId,
        parentId: this.data.flags.ddb.parentId,
        cobaltId: this.data.flags.ddb.cobaltId,
      });
    }

    this.#enhancedScenes();

    if (this.adventure.config.debug) logger.debug(`Scene name: "${this.data.name}" Img: "${this.data.img}"`);

    this.data._id = this.adventure.idFactory.getId(this.data, "Scene");

    this.#tokens();
    this.#lights();

    this.adventure.sceneImages.push(this.data.img);
    const sceneCount = this.adventure.sceneImages.filter(img => img === this.data.img).length;
    logger.info(`Generated Scene "${this.data.name}" with "${this.data.img}", (count ${sceneCount})`);
  }

  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }
}


exports.Scene = Scene;
