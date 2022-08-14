const logger = require("../logger.js");
const utils = require("./utils.js");

class IdFactory {

  static random() {
    utils.randomString(16,"#aA")
  }

  constructor(adventure) {
    this.adventure = adventure;
  }

  getId(document, docType) {
    const contentChunkId =  (document.flags.ddb.contentChunkId && document.flags.ddb.contentChunkId != "") ? 
      document.flags.ddb.contentChunkId :
      null;
  
    const existingId = this.adventure.ids.find((r) => {
      const basicCheck = r.type == document.type &&
        r.docType == docType &&
        r.ddbId == document.flags.ddb.ddbId &&
        r.cobaltId == document.flags.ddb.cobaltId &&
        r.parentId == document.flags.ddb.parentId;
      const chunkCheck = (contentChunkId !== null) ? 
        contentChunkId === r.contentChunkId :
        true;
      const sceneNotes = (document.flags.ddb.note) ? 
        document.name === r.name && r.note :
        true;
      const handout = (document.flags.ddb.img) ? 
        document.name === r.name && r.img :
        true;
      const scenePinIdMatch = (docType === "Note") ?
        document.flags.ddb.pin === r.scenePin :
        true;
  
      return basicCheck && chunkCheck && sceneNotes && handout && scenePinIdMatch;
    });
  
    if (existingId) {
      return existingId.id;
    } else {
      const id = {
        id: `${IdFactory.random()}`,
        type: document.type,
        docType: docType,
        ddbId: document.flags.ddb.ddbId,
        cobaltId: document.flags.ddb.cobaltId,
        parentId: document.flags.ddb.parentId,
        contentChunkId: contentChunkId,
        name: document.name,
        note: (document.flags.ddb.note) ? document.flags.ddb.note : false,
        img: (document.flags.ddb.img) ? document.flags.ddb.img : false,
        scenePin: document.flags.ddb.pin,
      };
      this.adventure.ids.push(id);
      return id.id;
    }
  }

}


exports.IdFactory = IdFactory;
