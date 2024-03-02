const { Scene } = require("./Scenes/Scene.js");
const { logger } = require("../logger");
const { SceneParser } = require("./Scenes/SceneParser.js");
const { FileHelper } = require("./FileHelper.js");
const path = require("path");
const fs = require("fs");

class SceneFactory {
  
  constructor(adventure) {
    this.adventure = adventure;
    this.tracker = {};
    this.fixedAdjustments = [];
  }

  saveIndividualScenes() {
    this.fixedAdjustments.forEach((adjustment) => {
      const flags = adjustment.flags.ddb;
      const ddbId = flags.ddbId;
      const cobaltId = flags.cobaltId ? `-${flags.cobaltId}` : "";
      const parentId = flags.parentId ? `-${flags.parentId}` : "";
      const contentChunkId = flags.contentChunkId ? `-${flags.contentChunkId}` : "";
      const sceneRef = `${this.adventure.bookCode}-${ddbId}${cobaltId}${parentId}${contentChunkId}`;
      const sceneDataDir = path.join(this.adventure.config.fixes.scenesDir, this.adventure.bookCode);
      const sceneDataFile = path.join(sceneDataDir, `${sceneRef}-scene.json`);
  
      console.log(`Sceneref: ${sceneRef}`);
      // console.log(`sceneDataDir: ${sceneDataDir}`);
      // console.log(`sceneDataFile: ${sceneDataFile}`);
      const sceneDataPath = path.resolve(__dirname, sceneDataFile);
  
      console.log(`Exporting datafile ${sceneDataPath}`);
      if (!fs.existsSync(sceneDataDir)) {
        console.log(`Creating dir ${sceneDataDir}`);
        fs.mkdirSync(sceneDataDir);
      }
      if (fs.existsSync(sceneDataPath)){
        console.log(`Scene ${sceneDataPath} exists, replacing.`);
      }
      FileHelper.saveJSONFile(adjustment, sceneDataPath);
    });
  }

  writeFixes() {
    logger.error(`Generated ${this.fixedAdjustments.length} scene adjustment fixes`);
    const savePath = path.join(this.adventure.config.fixes.scenesDir, this.adventure.bookCode);
    FileHelper.checkDirectories([savePath]);
    this.saveIndividualScenes();
  }

  generateMissingScenes() {
 
    if (this.adventure.enhancements.sceneEnhancements.length > 0) {
      logger.info("****************************");
      logger.info("Generating Missing Scenes");
      logger.info("----------------------------");
      logger.info(this.adventure.enhancements.sceneEnhancements.filter((es) => es.missing));
      logger.info("----------------------------");
  
    } else {
      logger.info("No missing scenes to process.");
    }

    this.adventure.enhancements.sceneEnhancements
      .filter((es) => es.missing)
      .forEach((es, index) => {
        const id =  90000 + es.ddbId + index;
        const adjustName = (es.adjustName && es.adjustName !== "") ? es.adjustName : es.name;
        const row = {
          title: `${es.name}`,
          id: id,
          slug: es.slug,
          parentId: es.parentId,
          cobaltId: es.cobaltId,
          documentName: es.name,
          sceneName: adjustName,
          contentChunkId: `ddb-missing-${this.adventure.bookCode}-${id}`,
          missing: true,
          hiresImg: es.hiresImg,
        };
        logger.info(`Attempting Missing Scene ${row.title} with ${row.contentChunkId}`);
        if (this.adventure.return) this.adventure.returns.statusMessage(`Attempting Missing Scene ${row.title}`);
        const scene = new Scene(this.adventure, { data: row}, es.img);
        this.adventure.scenes.push(scene);
      });

  }

  addNotes() {
    this.adventure.scenes.forEach((scene) => {
      scene.linkNotes();
    });
  }

  findScenes(row, document) {
    const sceneParser = new SceneParser(this, row, document);
    sceneParser.parse();
  }

}

exports.SceneFactory = SceneFactory;

