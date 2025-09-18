const logger = require("../../logger.js");

const { Helpers } = require("../Helpers.js");
const { ImageJournal } = require("../Journals/ImageJournal.js");
const { Scene } = require("./Scene.js");



class SceneParser {

  constructor(factory, row, document) {
    this.factory = factory;
    this.row = row;
    this.adventure = factory.adventure;
    this.document = document;
    this.tmpCount = 0;
    this.handoutTmpRef = this.document.flags.ddb.cobaltId ? this.document.flags.ddb.cobaltId : this.document.flags.ddb.parentId;
    let unknownHandoutCount = this.factory.tracker[this.handoutTmpRef];
    if (!Number.isInteger(unknownHandoutCount)) this.factory.tracker[this.handoutTmpRef] = 1;
    // this.unknownHandoutCount = Number.isInteger(unknownHandoutCount) ? unknownHandoutCount: 1;
  }


  #processFigureScene({ title, node, imageRef, ref, caption, titleType }) {
    logger.debug(`processFigureScene ${titleType} TITLE: ${title}`, {
      title,
      imageRef,
      refLink: ref.href,
    });

    if (title !== ref.textContent) {
      title = Helpers.titleString(title.replace(ref.textContent, "").trim());
    }

    let rowContentChunkId = caption.getAttribute("data-content-chunk-id");
    if (!rowContentChunkId) {
      // figure type embeds mostly don't have content chunk Id's 
      // we fall back to element ID which appears to be unique for the outer figure element
      rowContentChunkId = `${node.id}-${titleType.toLowerCase()}`;
    }

    let row = { data: {
      title: `${title} (${titleType} Version)`,
      id: 10000 + this.document.flags.ddb.ddbId + this.tmpCount,
      parentId: this.document.flags.ddb.parentId,
      cobaltId: this.document.flags.ddb.cobaltId,
      slug: this.document.flags.ddb.slug,
      documentName: this.document.name,
      sceneName: title,
      contentChunkId: rowContentChunkId,
      originDocId: this.document._id,
      originHint: `possibleFigureSceneNodes, ${titleType.toLowerCase()}`,
      originalLink: ref.href,
      player: true,
    }};
    this.tmpCount++;
    // const imageRef =  !playerRef && ungriddedRef ? img.src : ref.href;
    const playerEntry = new ImageJournal(this.adventure, row, imageRef.replace("ddb://image", "."));
    this.adventure.replaceLinks.push( {html: ref.outerHTML, ref: "" });
    this.document.text.content = this.document.text.content.replace(ref.outerHTML, "");
    const scene = new Scene(this.adventure, row, playerEntry.data.pages[0].src);
    this.adventure.scenes.push(scene);
  }

  #possibleFigureScenes() {

    if (this.possibleFigureSceneNodes.length > 0) {
      this.possibleFigureSceneNodes.forEach((node) => {
        let caption = node.querySelector("figcaption");
        let img = node.querySelector("img");
  
        const imgValid = img && img.src;
        this.tmpCount++;
  
        if (!caption) return;
        // logger.info(document);
        let title = caption.textContent.trim().replaceAll("  ", " ");
        const playerAll = Array.from(node.querySelectorAll("a")).find((el) => el.textContent.toLowerCase().includes("player"));
        const playerRef = node.querySelector("a[data-title*='player' i]") ?? playerAll;
        const unlabeledRef = node.querySelector("a[data-title*='unlabeled' i]");
        const ungriddedRef = node.querySelector("a[data-title*='without' i]");
        const mapRef = title.toLowerCase().startsWith("map") || img.src.includes("/map-")
          ? node.querySelector("a")
          : null;

        if (playerRef || unlabeledRef) {
          const ref = playerRef ?? unlabeledRef;
          let titleType = playerRef ? "Player" : "Unlabeled";
          logger.debug(`processing possibleFigureSceneNodes ${titleType} TITLE: ${title}`);

          this.#processFigureScene({
            title,
            node,
            imageRef: ref.href,
            ref,
            caption,
            titleType,
          });

        } else if (imgValid && (ungriddedRef || mapRef)) {
          const ref = ungriddedRef ?? mapRef;
          let titleType = ungriddedRef ? "Ungridded" : "Map";
          logger.debug(`processing possibleFigureSceneNodes no player ${titleType} TITLE: ${title}`);
          this.#processFigureScene({
            title,
            node,
            imageRef: img.src,
            ref,
            caption,
            titleType,
          });
        }

        if (!title || title === "") {
          title = `Handout ${this.factory.tracker[this.handoutTmpRef]}`;
          this.factory.tracker[this.handoutTmpRef]++;
        }

        logger.debug(`possibleFigureSceneNodes DM TITLE: ${title}`);
        // if (!playerRef) {
        //   this.adventure.replaceLinks.push( {html: img.outerHTML, ref: `${img.outerHTML}` });
        // }
      });
    }
  }

  #possibleDivScenes() {
    if (this.possibleFigureSceneNodes.length == 0 && this.possibleDivSceneNodes.length > 0) {
      // old style adventures don't have figure tags, hard parse
      // compendium-image-with-subtitle-center
      this.possibleDivSceneNodes.forEach((node) => {
        let caption = node.querySelector("h3, h4");
        let img = node.querySelector("img");
  
        if (!img || !img.src) return;
        this.tmpCount++;
  
        if (caption) {
          logger.info(`Checking ${caption.textContent} for Scenes`);
          // logger.info(document);
          let title = caption.textContent;
          let nextNode = this.row.doc.getElementById(node.id);
          let playerVersion = false;
          let unlabeledVersion = false;
          let lightBoxNode;
  
          for (let i = 0; i < 15; i++) {
            if (!nextNode) {
              lightBoxNode = Array.from(node.querySelectorAll("a.ddb-lightbox-outer"))
                .find(el => el.textContent.toLowerCase().includes("player") || el.textContent.toLowerCase().includes("unlabeled"));
              // logger.info(lightBoxNode.outerHTML)
              // logger.info(`Attempting div query ${lightBoxNode}`)
            } else {
              nextNode = nextNode.nextSibling;
              if (!nextNode || !nextNode.tagName) continue;
              lightBoxNode = (nextNode.tagName == "P") ? nextNode.querySelector("a.ddb-lightbox-outer") : undefined;
            }
            if (lightBoxNode) {
              playerVersion = lightBoxNode.textContent.toLowerCase().includes("player");
              unlabeledVersion = lightBoxNode.textContent.toLowerCase().includes("unlabeled");
              break;
            }
          }
  
          if (playerVersion || unlabeledVersion) {
            //const playerRef = nextNode.querySelector("a.ddb-lightbox-outer");
            const playerRef = lightBoxNode;
            title = Helpers.titleString(title.replace(playerRef.textContent, "").trim());
  
            let titleType = playerVersion ? "Player" : "Unlabeled";
  
            let row = { data: {
              title: `${title} (${titleType} Version)`,
              id: 11000 + this.document.flags.ddb.ddbId + this.tmpCount,
              parentId: this.document.flags.ddb.parentId,
              cobaltId: this.document.flags.ddb.cobaltId,
              slug: this.document.flags.ddb.slug,
              documentName: this.document.name,
              sceneName: Helpers.titleString(title),
              contentChunkId: (nextNode) ? nextNode.getAttribute("data-content-chunk-id") : undefined,
              originDocId: this.document._id,
              originHint: `possibleDivSceneNodes, ${titleType.toLowerCase()}`,
              originalLink: playerRef.href,
              player: true,
            }};
            this.tmpCount++;
            const playerEntry = new ImageJournal(this.adventure, row, playerRef.href.replace("ddb://image", "."));
            this.adventure.replaceLinks.push({html: playerRef.outerHTML, ref: "" });
            this.document.text.content = this.document.text.content.replace(playerRef.outerHTML, "");

            const scene = new Scene(this.adventure, row, playerEntry.data.pages[0].src);
            this.adventure.scenes.push(scene);
          }
  
          // if (!playerVersion) {
          //   this.adventure.replaceLinks.push( {html: img.outerHTML, ref: `${img.outerHTML}` });
          // }
        }
      });
    }
  
  }

  #possibleViewPlayerScenes() {
    if (this.possibleFigureSceneNodes.length == 0 && this.possibleViewPlayerScenes.length > 0) {
      // old style adventures don't have figure tags, hard parse
      // compendium-image-with-subtitle-center
      this.possibleViewPlayerScenes.forEach((node) => {
        let aNode = node.querySelector("a.ddb-lightbox-outer");
        if (!aNode || aNode.length == 0) return; 
  
        this.tmpCount++;
        if (this.adventure.config.debug) {
          logger.verbose(aNode.outerHTML);
        }
  
        let title = `${this.document.name} (Player Version)`;
  
        let row = { data: {
          title: title,
          id: 13000 + this.document.flags.ddb.ddbId + this.tmpCount,
          parentId: this.document.flags.ddb.parentId,
          cobaltId: this.document.flags.ddb.cobaltId,
          documentName: this.document.name,
          sceneName: Helpers.titleString(this.document.name),
          contentChunkId: node.getAttribute("data-content-chunk-id"),
          slug: this.document.flags.ddb.slug,
          originDocId: this.document._id,
          originHint: "possibleViewPlayerScenes, player",
          originalLink: aNode.href,
          player: true,
        }};
        const journalEntry = new ImageJournal(this.adventure, row, aNode.href.replace("ddb://image", "."));
  
        // don't add entry if we have already parsed this
        // 
        if (!journalEntry.data.flags.ddb.duplicate) {
          this.adventure.replaceLinks.push({ html: aNode.outerHTML, ref: "" });
          this.document.text.content = this.document.text.content.replace(aNode.outerHTML, "playerText");
        }
        if (!this.adventure.sceneImages.includes(journalEntry.data.pages[0].src)) {
          const scene = new Scene(this.adventure, row, journalEntry.data.pages[0].src);
          this.adventure.scenes.push(scene);
        }
      });
    }
  }

  #possibleUnknownPlayerLinks() {
    this.possibleUnknownPlayerLinks.forEach((node) => {
      if (this.adventure.sceneImages.includes(node.href)) return;
      const playerNode = node.textContent.toLowerCase().includes("player");
      const unlabeledNode = node.textContent.toLowerCase().includes("unlabeled");
      if (!playerNode && !unlabeledNode) return;
  
      this.tmpCount++;
      if (this.adventure.config.debug) {
        logger.verbose(node.outerHTML);
      }
  
      let titleType = playerNode ? "Player" : "Unlabeled";
      let title = `${this.document.name} (${titleType} Version)`;
  
      const parentId = node.parentElement.getAttribute("data-content-chunk-id");
      const nodeId = node.getAttribute("data-content-chunk-id");
      const contentChunkId = parentId
        ? parentId
        : nodeId
          ? nodeId
          : `${this.document.flags.ddb.ddbId}-${this.document.flags.ddb.parentId}-${this.tmpCount}-${this.document.flags.ddb.slug}`.replace("#","-");
  
      let row = { data: {
        title: title,
        id: 14000 + this.document.flags.ddb.ddbId + this.tmpCount,
        parentId: this.document.flags.ddb.parentId,
        cobaltId: this.document.flags.ddb.cobaltId,
        documentName: this.document.name,
        sceneName: Helpers.titleString(this.document.name),
        contentChunkId: contentChunkId,
        slug: this.document.flags.ddb.slug,
        originDocId: this.document._id,
        originHint: `possibleUnknownPlayerLinks, ${titleType}`,
        originalLink: node.href,
        player: true,
      }};
      const journalEntry = new ImageJournal(this.adventure, row, node.href.replace("ddb://image", "."));
  
      // don't add entry if we have already parsed this
      if (!journalEntry.data.flags.ddb.duplicate) {
        this.adventure.replaceLinks.push( {html: node.outerHTML, ref: "" });
        this.document.text.content = this.document.text.content.replace(node.outerHTML, "");
      }
      if (!this.adventure.sceneImages.includes(journalEntry.data.pages[0].src)) {
        const scene = new Scene(this.adventure, row, journalEntry.data.pages[0].src);
        this.adventure.scenes.push(scene);
      }
    });
  }

  // not only does scene parser parse out scenes, it also finds handouts and related material
  parse() {

    logger.info("----------------------------------------------");
    logger.info(`Finding Scenes in ${this.document.name}`);
    if (this.adventure.return) this.adventure.returns.statusMessage(`Finding Scenes in ${this.document.name}`);

    // let possibleSceneNodes = frag.querySelectorAll("a[data-lightbox]");
    this.possibleFigureSceneNodes = this.row.doc.body.querySelectorAll("figure");
    this.possibleDivSceneNodes = this.row.doc.body.querySelectorAll("div.compendium-image-with-subtitle-center, div.compendium-image-with-subtitle-right, div.compendium-image-with-subtitle-left");
    this.possibleViewPlayerScenes = this.row.doc.body.querySelectorAll("p.compendium-image-view-player");
    this.possibleUnknownPlayerLinks = this.row.doc.body.querySelectorAll("a.ddb-lightbox-inner, a.ddb-lightbox-outer");

    logger.info(`possibleFigureSceneNodes ${this.possibleFigureSceneNodes.length}`);
    logger.info(`possibleDivSceneNodes ${this.possibleDivSceneNodes.length}`);
    logger.info(`possibleViewPlayerScenes ${this.possibleViewPlayerScenes.length}`);
    logger.info(`possibleUnknownPlayerLinks ${this.possibleUnknownPlayerLinks.length}`);

    this.#possibleFigureScenes();
    this.#possibleDivScenes();
    this.#possibleViewPlayerScenes();
    this.#possibleUnknownPlayerLinks();

  }
}

exports.SceneParser = SceneParser;
