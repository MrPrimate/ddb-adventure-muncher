
const logger = require("../../logger.js");
const path = require("path");

class Folder {

  static FOLDER_SORT = 4000;

  addFolder() {
    this.adventure.folders.push(this.data);
  }

  get id() {
    return this.data._id;
  }

  constructor({adventure, row, type, specialType = null}) {
    this.adventure = adventure;
    const folderJsonPath = path.join("../../", this.adventure.overrides.templateDir,"folder.json");
    this.data = JSON.parse(JSON.stringify(require(folderJsonPath)));

    this.data.name = row.data.title;
    this.data.type = type;
    this.data.sort = Folder.FOLDER_SORT + parseInt(row.data.id);

    this.data.flags.ddb.ddbId = (row.data.ddbId) ? row.data.ddbId : row.data.id;
    this.data.flags.ddb.img = specialType === "image";
    this.data.flags.ddb.note = specialType === "note";

    // detect parent folders
    if (row.data.cobaltId && specialType !== "base") {
      // by default place folder in root folder
      this.data.parent = this.adventure.masterFolder[type]._id;
    }

    const parentId = (row.data.cobaltId) ? row.data.cobaltId : row.data.parentId;

    // handle changes based on various folder types
    switch (specialType) {
      case "note": {
        const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
        this.data.name = `[Pins] ${row.data.sceneName ? row.data.sceneName : parent.name}`;
        this.data.sorting = "a";
        this.data.parent = `${parent._id}`;
        this.data.flags.ddb.parentId = parentId;
        break;
      }
      case "image": {
        const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == parentId && f.type == type && !f.flags.ddb.img && !f.flags.ddb.note);
        this.data.name = `[Handouts] ${row.data.sceneName ? row.data.sceneName : (parent) ? parent.name: row.data.title }`;
        this.data.sort = 1000000;
        if (parent) { // tmp fix for hftt, for some reason it does not generate a parent folder
          this.data.parent = `${parent._id}`;
        }
        this.data.flags.ddb.parentId = parentId;
        break;
      }
      case "section": {
        const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == row.data.parentId && f.type == type && !f.flags.ddb.img);
        if (parent) {
          this.data.parent = `${parent._id}`;
          this.data.name = `[Sections] ${parent.name}`;
        }
        this.data.flags.ddb.parentId = row.data.parentId;
        if (!this.data.name || this.data.name === "") {
          logger.warn("NO NAME ROW FOUND (parent)!!!");
        }
        break;
      }
      case "base": {
        if (type === "Actor") this.data.sorting = "a";
        break;
      }
      default: {
        // place in root folder
        const parent = this.adventure.folders.find((f) => f.flags.ddb.cobaltId == -1 && f.type == type && !f.flags.ddb.img);
        if (parent) this.data.parent = `${parent._id}`;
        if (!this.data.name || this.data.name === "") {
          logger.warn("NO NAME ROW FOUND!!!");
        }
      }
    }

    if (row.data.cobaltId) this.data.flags.ddb.cobaltId = row.data.cobaltId;  
    if (row.data.nameOverride) this.data.name = row.data.nameOverride;

    this.data._id = this.adventure.idFactory.getId(this.data, "Folder");
    this.data.flags.importid = this.data._id;

    //
    this.addFolder();
    
    if (type === "JournalEntry" && !specialType.includes["base", "note", "image", "section"] ) {
      // lets generate a Scene && RollTable Folders at the same time
      // we do this so the scene folder order matches the same as the journals as some
      // adventures e.g. CoS have different kind of scene detection
      this.adventure.folderFactory.getFolderId(row, "Scene", specialType);
      this.adventure.folderFactory.getFolderId(row, "RollTable", specialType);
    }
  }

  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }

}

exports.Folder = Folder;
