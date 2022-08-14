const logger = require("../logger.js");


class FolderFactory {

  static FOLDER_SORT = 4000;

  constructor(adventure) {
    this.adventure = adventure;
    this.folderJsonPath = path.join(this.adventure.overrides.templateDir,"folder.json");
  }

  generateFolder(type, row, baseFolder=false, img=false, note=false) {
    const folder = JSON.parse(JSON.stringify(require(this.folderJsonPath)));
    folder.flags.ddb.ddbId = (row.ddbId) ? row.ddbId : row.id;
    folder.flags.ddb.img = img;
    folder.flags.ddb.note = note;
    folder.name = row.title;
    folder.type = type;
    folder.sort = Folders.FOLDER_SORT + parseInt(row.id);
    if (row.cobaltId && !baseFolder) {
      folder.parent = masterFolder[type]._id;
    }
    if (note) {
      const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
      const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
      folder.name = `[Pins] ${row.sceneName ? row.sceneName : parent.name}`;
      // folder.sort = 900000;
      folder.sorting = "a";
      folder.parent = `${parent._id}`;
      folder.flags.ddb.parentId = parentId;
    }
    else if (img) {
      // logger.info(row);
      const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
      const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
      folder.name = `[Handouts] ${row.sceneName ? row.sceneName : (parent) ? parent.name: row.title }`;
      folder.sort = 1000000;
      if (parent) { // tmp fix for hftt, for some reason it does not generate a parent folder
        folder.parent = `${parent._id}`;
      }
      folder.flags.ddb.parentId = parentId;
    } else if (row.parentId) {
      const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == row.parentId && f.type == type && !f.flags.ddb.img);
      if (parent) {
        folder.parent = `${parent._id}`;
        folder.name = `[Sections] ${parent.name}`;
      }
      folder.flags.ddb.parentId = row.parentId;
      if (!folder.name || folder.name === "") {
        logger.warn("NO NAME ROW FOUND (parent)!!!");
      }
  
    } else if(!baseFolder) {
      const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == -1 && f.type == type && !f.flags.ddb.img);
      if (parent) folder.parent = `${parent._id}`;
      if (!folder.name || folder.name === "") {
        logger.warn("NO NAME ROW FOUND!!!");
      }
    }
    if (row.cobaltId) folder.flags.ddb.cobaltId = row.cobaltId;
  
    if (baseFolder && type === "Actor") folder.sorting = "a";
  
    if (row.nameOverride) folder.name = row.nameOverride;
  
    folder._id = this.adventure.idFactory.getId(folder, "Folder");
    folder.flags.importid = folder._id;
    this.adventure.folders.push(folder);
    if (type === "JournalEntry" && !baseFolder && !img && !note) {
      // lets generate a Scene Folder at the same time
      // we do this so the scene folder order matches the same as the journals as some
      // adventures e.g. CoS have different kind of scene detection
      this.getFolderId(row, "Scene");
      this.getFolderId(row, "RollTable");
    }
    return folder;
  }

  getFolderId(row, type, img, note) {
    let folderId;
    let folder;
  
    if (note) {
      const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
      folder = this.adventure.folders.find((f) => f.flags.ddb.ddbId == row.ddbId && f.flags.ddb.parentId == parentId && f.type == type && !f.flags.ddb.img && f.flags.ddb.note == note && f.name.includes(row.sceneName));
      if (!folder) folder = this.generateFolder(type, row, false, img, note);
      folderId = folder._id;
    } else if (img) {
      const parentId = (row.cobaltId) ? row.cobaltId : row.parentId;
      folder = this.adventure.folders.find((f) => f.flags.ddb.parentId == parentId && f.type == type && f.flags.ddb.img == img);
      if (!folder) folder = this.generateFolder(type, row, false, img, note);
      folderId = folder._id;
    } else if (row.cobaltId) {
      folder = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == row.cobaltId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
      if (!folder) folder = this.generateFolder(type, row, false, img, note);
      folderId = folder._id;
    } else if (row.parentId) {
      folder = this.adventure.folders.find((f) => f.flags.ddb.parentId == row.parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
      if (!folder) folder = this.generateFolder(type, row, false, img, note);
      folderId = folder._id;
    }

    return folderId;
  }
}

exports.FolderFactory = FolderFactory;
