const { Helpers } = require("./Helpers.js");

class IdFactory {

  static random() {
    return Helpers.randomString(16,"#aA");
  }

  constructor(adventure) {
    this.adventure = adventure;
  }

  // Build a composite key that replicates the conditional matching logic
  // of the original .find() implementation.
  //
  // The original logic:
  //   basicCheck: type, docType, ddbId, cobaltId, parentId must all match
  //   chunkCheck: only applied when contentChunkId is non-null
  //   sceneNotes: only applied when document.flags.ddb.note is truthy (matches name + note)
  //   handout: only applied when document.flags.ddb.img is truthy (matches name + img)
  //   scenePinIdMatch: only applied when docType === "Note" (matches pin)
  //
  // When a condition is "not applicable", the original returns true (matches anything).
  // We replicate this by only including conditional fields in the key when they're relevant.
  static #makeKey(type, docType, ddbId, cobaltId, parentId, contentChunkId, note, img, name, pin) {
    let key = `${type}|${docType}|${ddbId}|${cobaltId}|${parentId}`;
    if (contentChunkId !== null) {
      key += `|chunk:${contentChunkId}`;
    }
    if (note) {
      key += `|note:${name}`;
    }
    if (img) {
      key += `|img:${name}`;
    }
    if (docType === "Note") {
      key += `|pin:${pin}`;
    }
    return key;
  }

  getId(document, docType) {
    const contentChunkId = (document.flags.ddb.contentChunkId && document.flags.ddb.contentChunkId != "")
      ? document.flags.ddb.contentChunkId
      : null;

    const note = document.flags.ddb.note || false;
    const img = document.flags.ddb.img || false;
    const pin = document.flags.ddb.pin;

    const key = IdFactory.#makeKey(
      document.type, docType,
      document.flags.ddb.ddbId, document.flags.ddb.cobaltId, document.flags.ddb.parentId,
      contentChunkId, note, img, document.name, pin
    );

    const existing = this.adventure.ids.get(key);

    if (existing) {
      return existing.id;
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
        note: note,
        img: img,
        scenePin: pin,
      };
      this.adventure.ids.set(key, id);
      return id.id;
    }
  }

  // Convert an array of id records (from JSON) to a Map
  static arrayToMap(arr) {
    const map = new Map();
    for (const record of arr) {
      const key = IdFactory.#makeKey(
        record.type, record.docType,
        record.ddbId, record.cobaltId, record.parentId,
        record.contentChunkId ?? null,
        record.note || false, record.img || false,
        record.name, record.scenePin
      );
      map.set(key, record);
    }
    return map;
  }

  // Convert a Map back to an array for JSON serialization
  static mapToArray(map) {
    return [...map.values()];
  }

}


exports.IdFactory = IdFactory;
