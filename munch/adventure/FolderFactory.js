const logger = require("../logger.js");
const Folder = require("./Folders/Folder.js");


class FolderFactory {

  constructor(adventure) {
    this.adventure = adventure;
  }

  getFolderId(row, type, specialType = null) {
    let folder;

    const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;

    const folderData = {
      adventure: this.adventure,
      row,
      type,
      specialType,
    };

    switch (specialType) {
      case "note": {
        folder = this.adventure.folders.find((f) =>
          f.flags.ddb.ddbId == row.ddbId &&
          f.flags.ddb.parentId == parentId &&
          f.type == type && !f.flags.ddb.img &&
          f.flags.ddb.note == note && 
          f.name.includes(row.sceneName)
        );
        break;
      }
      case "image": {
        folder = this.adventure.folders.find((f) =>
          f.flags.ddb.parentId == parentId &&
          f.type == type &&
          f.flags.ddb.img == img
        );
        break;
      }
      default: {
        if (row.cobaltId) {
          folder = this.adventure.folders.find((f) =>
            f.flags.ddb.cobaltId == row.cobaltId &&
            f.type == type && !f.flags.ddb.img &&
            !f.flags.ddb.note
          );
        } else if (row.parentId) {
          folder = this.adventure.folders.find((f) =>
            f.flags.ddb.parentId == row.parentId &&
            f.type == type &&
            !f.flags.ddb.img &&
            !f.flags.ddb.note
          );
        }
      }
    }

    if (!folder) folder = new Folder(folderData);
    return folder._id;
  }
}

exports.FolderFactory = FolderFactory;
