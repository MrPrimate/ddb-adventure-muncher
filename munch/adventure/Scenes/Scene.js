const logger = require("../../logger.js");
const _ = require("lodash");
const sizeOf = require("image-size");

class Scene {

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
    let journalMatch = this.adventure.config.v10Mode
      ? generatedJournals.map((j) => j.pages).flat().find((journal) => journal._id === row.data.originDocId)
      : generatedJournals.find((journal) => journal._id === row.data.originDocId);
    if (!journalMatch) {
      journalMatch = this.adventure.config.v10Mode
        ? generatedJournals.map((j) => j.pages).flat().find((journalPage) => 
          journalPage.name.includes(this.data.navName) &&
          !journalPage.flags.ddb.notes && !journalPage.flags.ddb.img && !journalPage.src
        )
        : generatedJournals.find((journal) => 
          journal.name.includes(this.data.navName) &&
          !journal.flags.ddb.notes && !journal.flags.ddb.img && !journal.img
        );
    }
    if (journalMatch) this.data.journal = journalMatch._id;
  }

  // here we load adjustment data from ddb-meta-data
  // this is the magic that adds walls, actor positions and note data
  #adjustment() {
    let adjustment = (this.data.flags.ddb.contentChunkId) ?
      sceneAdjustments.find((s) =>
        (this.data.flags.ddb.contentChunkId === s.flags.ddb.contentChunkId &&
        this.data.flags.ddb.ddbId == s.flags.ddb.ddbId &&
        this.data.flags.ddb.parentId == s.flags.ddb.parentId &&
        this.data.flags.ddb.cobaltId == s.flags.ddb.cobaltId) ||
        (s.flags.ddb.alternateIds && s.flags.ddb.alternateIds.some((ai) =>
          this.data.flags.ddb.contentChunkId === ai.contentChunkId &&
          this.data.flags.ddb.ddbId == ai.ddbId &&
          this.data.flags.ddb.parentId == ai.parentId &&
          this.data.flags.ddb.cobaltId == ai.cobaltId
        ))
      ) :
      sceneAdjustments.find((s) => this.data.name.includes(s.name));

    if (adjustment) {
      logger.info(`ADJUSTMENTS found named ${adjustment.name} with chunkid "${adjustment.flags.ddb.contentChunkId}" and id ${adjustment.flags.ddb.ddbId}`);
      if (adjustment.flags.ddb.tiles) {
        adjustment.tiles = adjustment.flags.ddb.tiles;
      }
      if (adjustment.flags.ddb.notes) {
        logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        logger.info("Found note adjutments");

        adjustment.notes = [];

        adjustment.flags.ddb.notes.forEach((note) => {
          logger.info(`Checking ${note.label}`);
          const noteJournal = this.adventure.journals.find((journal) => {
            const contentChunkIdMatch = note.flags.ddb.contentChunkId ?
              journal.data.flags.ddb && note.flags.ddb && journal.data.flags.ddb.contentChunkId == note.flags.ddb.contentChunkId :
              false;

            const noContentChunk = !note.flags.ddb.contentChunkId &&
              note.flags.ddb.originalLink && note.flags.ddb.ddbId && note.flags.ddb.parentId &&
              note.flags.ddb.slug && note.flags.ddb.linkName;
            const originMatch = noContentChunk ?
              journal.data.flags.ddb.slug == note.flags.ddb.slug &&
              journal.data.flags.ddb.ddbId == note.flags.ddbId &&
              journal.data.flags.ddb.parentId == note.flags.ddb.parentId &&
              journal.data.flags.ddb.cobaltId == note.flags.ddb.cobaltId &&
              journal.data.flags.ddb.originalLink == note.flags.ddb.originalLink &&
              journal.data.flags.ddb.linkName == note.flags.ddb.linkName :
              false;
            const journalNameMatch = !contentChunkIdMatch && !originMatch ?
              this.adventure.config.v10Mode
                ? journal.data.pages.some((page) => page.name.trim() === note.label.trim())
                : journal.data.name.trim() == note.label.trim() :
              false;
            return contentChunkIdMatch || originMatch || journalNameMatch;

          });
          if (noteJournal){
            logger.info(`Found ${note.label} matched to ${noteJournal.data._id} (${noteJournal.data.name})`);
            note.positions.forEach((position) => {
              noteJournal.data.flags.ddb.pin = `${position.x}${position.y}`;
              const noteId = this.adventure.idFactory.getId(noteJournal, "Note");
              const n = {
                "_id": noteId,
                "flags": {
                  "ddb": note.flags.ddb,
                  "importid": noteId,
                },
                "entryId": noteJournal.data._id,
                "x": position.x,
                "y": position.y,
                "icon": icons.generateIcon(this.adventure.config, note.label, templateDir),
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
      logger.info(this.data.flags);
      this.data = _.merge(this.data, adjustment);
    } else {
      logger.info(`NO ADJUSTMENTS found with chunkid "${this.data.flags.ddb.contentChunkId}" and id ${this.data.flags.ddb.ddbId}`);
    }
  }

  // this enriches with enhanced scene data
  #enhancedScenes() {
    const disableEnhancedDownloads = (this.adventure.config.disableEnhancedDownloads) ? 
      this.adventure.config.disableEnhancedDownloads :
      false;

    const enhancedScene = enhancedScenes.find((scene) => {
      const missingNameMatch = row.data.missing ?
        scene.missing && row.data.title === scene.name :
        true;
      return missingNameMatch && 
        scene.img === this.data.img &&
        scene.bookCode === this.adventure.config.run.bookCode;
    });
    if (this.adventure.config.debug) logger.debug(enhancedScene);

    if (enhancedScene) {
      if (enhancedScene.adjustName && enhancedScene.adjustName.trim() != "") {
        this.data.name = enhancedScene.adjustName;
        this.data.navName = enhancedScene.adjustName;
      }
      if (enhancedScene.hiresImg && !disableEnhancedDownloads) {
        downloadList.push({name: this.data.name, url: enhancedScene.hiresImg, path: this.data.img });
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
          logger.info(`Found actor with Id ${ddbId}`);

          if (!this.adventure.required.monsters.includes(String(ddbId))) {
            this.adventure.required.monsters.push(String(ddbId));
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

  constructor(adventure, row, image) {
    logger.info(`Generating Scene ${row.data.sceneName}`);
    this.adventure = adventure;
    this.image = image;
    this.imagePath = path.join(this.adventure.config.run.outputDir, image);
    this.contentChunkId =  (row.data.contentChunkId && row.data.contentChunkId != "")
      ? row.data.contentChunkId
      : null;

    // load skeleton
    this.data = JSON.parse(JSON.stringify(require(path.join(this.adventure.overrides.templateDir,"scene.json"))));

    // initial image size guess (used if not set by adjustment)
    const dimensions = this.imageSize(imagePath);
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
    this.data.flags.ddb.bookCode = this.adventure.config.run.bookCode;
    this.data.flags.ddb.slug = row.data.slug;
    this.data.flags.ddb.contentChunkId = this.contentChunkId;
    this.data.flags.ddb.userData = this.adventure.config.run.userData;
    this.data.flags.ddb.originDocId = row.data.originDocId;
    this.data.flags.ddb.originHint = row.data.originHint;
    this.data.flags.ddb.originalLink = row.data.originalLink;
    this.data.flags.ddb.versions = {
      "adventureMuncher": this.adventure.config.run.version
    };

    if (row.data.cobaltId) this.data.flags.ddb.cobaltId = row.data.cobaltId;
    if (row.data.parentId) {
      row.data.cobaltId = row.data.parentId;
      this.data.flags.ddb.parentId = row.data.parentId;
      delete row.data.parentId;
    }
    row.data.title = row.data.documentName;
    this.data.folder = this.adventure.folderFactory.getFolderId(row, "Scene");

    // load meta-data adjustments
    this.#adjustment();

    // record this if we are recording scene information
    if (this.adventure.config.imageFind) {
      this.adventure.imageFinder.sceneResults.push({
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

    this.data._id = getId(this.data, "Scene");

    this.#tokens();

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
