const { Scene } = require("./Scenes/Scene.js");
const { ImageJournal } = require("./Journals/ImageJournal.js");
const { logger } = require("../logger");

class SceneFactory {
  
  constructor(adventure) {
    this.adventure = adventure;
  }

  generateMissingScenes() {
 
    logger.info("****************************");
    logger.info("Generating Missing Scenes");
    logger.info("----------------------------");
    logger.info(this.adventure.enhancements.sceneEnhancements.filter((es) => es.missing));
    logger.info("----------------------------");
  
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
        };
        logger.info(`Attempting ${row.title} with ${row.contentChunkId}`);
        const playerEntry = new ImageJournal(this.adventure, row, es.img);
        this.adventure.journals.push(playerEntry);
        const scene = new Scene(this.adventure, row, es.img);
        this.adventure.scenes.push(scene);
      });

  }

}

exports.SceneFactory = SceneFactory;

