const { Folder } = require("./Folders/Folder.js");
const _ = require("lodash");

class FolderFactory {

  generateMasterFolders() {
    const mainRow = { id: -1, cobaltId: -1, title: this.adventure.config.book.description };

    const folderData = {
      adventure: this.adventure,
      row: { data: mainRow },
      specialType: "base",
    };
    const mainJournal = new Folder(_.merge(folderData, { type: "JournalEntry"}));
    const sceneJournal = new Folder(_.merge(folderData, { type: "Scene"}));
    const rollTableJournal = new Folder(_.merge(folderData, { type: "RollTable"}));
    const actorJournal = new Folder(_.merge(folderData, { type: "Actor"}));

    this.masterFolders = {
      JournalEntry: mainJournal.toObject(),
      Scene: sceneJournal.toObject(),
      RollTable: rollTableJournal.toObject(),
      Actor: actorJournal.toObject(),
    };
  }

  constructor(adventure) {
    this.adventure = adventure;
    this.masterFolders = {};
  }

  getFolderId(row, type, specialType = null) {
    let folder;

    const parentId = (row.data.cobaltId) ? row.data.cobaltId : row.data.parentId;

    const folderData = {
      adventure: this.adventure,
      row,
      type,
      specialType,
    };

    switch (specialType) {
      case "note": {
        folder = this.adventure.folders.find((f) =>
          f.flags.ddb.ddbId == row.data.ddbId
          && f.flags.ddb.parentId == parentId
          && f.type == type && !f.flags.ddb.img
          && f.flags.ddb.note === true 
          && f.name.includes(row.data.sceneName)
        );
        break;
      }
      case "image": {
        folder = this.adventure.folders.find((f) =>
          f.flags.ddb.parentId == parentId
          && f.type == type
          && f.flags.ddb.img === true
        );
        break;
      }
      // case "journal": {
      //   folder = this.adventure.folderFactory.masterFolders[type];
      //   break;
      // }
      default: {
        if (row.data.cobaltId) {
          folder = this.adventure.folders.find((f) =>
            f.flags.ddb.cobaltId == row.data.cobaltId
            && f.type == type
            && !f.flags.ddb.img
            && !f.flags.ddb.note
          );
        } else if (row.data.parentId) {
          folder = this.adventure.folders.find((f) =>
            f.flags.ddb.parentId == row.data.parentId
            && f.type == type
            && !f.flags.ddb.img
            && !f.flags.ddb.note
          );
        }
      }
    }

    if (!folder) folder = new Folder(folderData);
    // we discard folders for journals and use top level, but still need to create subs for images and notes
    if (specialType === "journal") {
      folder = this.adventure.folderFactory.masterFolders[type];
    }
    return folder._id;
  }
}

exports.FolderFactory = FolderFactory;
