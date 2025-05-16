
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

  get _id() {
    return this.data._id;
  }

  getParentFolder() {
    let parent = null;
    switch (this.specialType) {
      case "note": {
        parent = this.adventure.folders.find((f) =>
          f.flags.ddb.cobaltId == this.parentId
          && f.type == this.type
          && !f.flags.ddb.img
          && !f.flags.ddb.note
        );
        break;
      }
      case "image": {
        parent = this.adventure.folders.find((f) =>
          f.flags.ddb.cobaltId == this.parentId
          && f.type == this.type
          && !f.flags.ddb.img
          && !f.flags.ddb.note
        );
        break;
      }
      case "section": {
        parent = this.adventure.folders.find((f) =>
          f.flags.ddb.cobaltId == this.row.data.parentId
          && f.type == this.type
          && !f.flags.ddb.img
        );
        if (!parent) {
          logger.warn(`No parent found for ${this.type} ${this.specialType} ${this.row.data.title}, forcing journal`);
          parent = new Folder({
            adventure: this.adventure,
            row: this.row,
            type: this.type,
            specialType: "journal",
          });
        }
        break;
      }
      case "base": {
        break;
      }
      default: {
        // place in root folder
        parent = this.adventure.folders.find((f) =>
          f.flags.ddb.cobaltId == -1
          && f.type == this.type
          && !f.flags.ddb.img
        );
        break;
      }
    }
    if (!parent && this.specialType !== "base") {
      logger.warn(`No parent found for ${this.type} ${this.specialType} ${this.row.data.title}`);
      parent = new Folder({
        adventure: this.adventure,
        row: this.row,
        type: this.type,
        specialType: this.specialType,
      });
    }
    return parent;
  }


  constructor({adventure, row, type, specialType = null}) {
    this.adventure = adventure;
    this.type = type;
    this.specialType = specialType;
    this.row = row;
    const folderJsonPath = path.join(this.adventure.overrides.templateDir, "folder.json");
    this.data = JSON.parse(JSON.stringify(require(folderJsonPath)));

    this.data.name = row.data.title;
    this.data.type = type;
    this.data.sort = Folder.FOLDER_SORT + parseInt(row.data.id);

    this.data.flags.ddb.ddbId = (row.data.ddbId) ? row.data.ddbId : row.data.id;
    this.data.flags.ddb.img = specialType === "image";
    this.data.flags.ddb.note = specialType === "note";
    this.data.flags.ddb.specialType = specialType;

    // detect parent folders
    if (row.data.cobaltId && specialType !== "base") {
      // by default place folder in root folder
      this.data.parent = this.adventure.folderFactory.masterFolders[type]._id;
    }

    this.parentId = (row.data.cobaltId) ? row.data.cobaltId : row.data.parentId;
    this.parent = this.getParentFolder();

    // handle changes based on various folder types
    switch (specialType) {
      case "note": {
        this.data.name = `[Pins] ${row.data.sceneName ? row.data.sceneName : this.parent.name}`;
        this.data.sorting = "a";
        this.data.parent = `${this.parent._id}`;
        this.data.flags.ddb.parentId = this.parentId;
        break;
      }
      case "image": {
        this.data.name = `[Handouts] ${row.data.sceneName ? row.data.sceneName : (this.parent) ? this.parent.name : row.data.title }`;
        this.data.sort = 1000000;
        if (this.parent) { // tmp fix for hftt, for some reason it does not generate a parent folder
          this.data.parent = `${this.parent._id}`;
        }
        this.data.flags.ddb.parentId = this.parentId;
        break;
      }
      case "section": {
        if (this.parent) {
          this.data.parent = `${this.parent._id}`;
          this.data.name = `[Sections] ${this.parent.name}`;
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
        if (this.parent) this.data.parent = `${this.parent._id}`;
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
