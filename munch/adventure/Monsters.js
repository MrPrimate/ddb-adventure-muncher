const logger = require("../logger.js");

const { Database } = require("./Database.js");

const fs = require("fs");
const path = require("path");
const { FileHelper } = require("./FileHelper.js");
const { sources } = require("../data/bookData.js");



class Monsters {

  constructor(adventure) {
    this.adventure = adventure;
    this.monsters = [];

    this.data = [];
    this.sourceData = [];
    this.db = new Database(this.adventure);
    this.destinationPath = process.env.MONSTER_OUTPUT_FILE ?? this.adventure.config.outputDir;
  }

  async load() {
    this.db.loadDB();
    this.monsters = this.db.query(Database.getMonstersSQL);
    try {
      this.treasureMappings = this.db.query(Database.getMonstersTreasureMapping);
      this.treasures = this.db.query(Database.getMonsterTreasures);
    } catch (err) {
      this.treasureMappings = [];
      this.treasures = [];
    }
    
  }

  getContent(monsterID) {
    return this.db.query(Database.getContentDetailByContentId(monsterID));
  }

  processMonster(monster) {
    const treasureSearch = this.treasureMappings.find((m) => m.RPGMonsterID === monster.ID);
    const treasure = treasureSearch
      ? this.treasures.find((t) => t.ID === treasureSearch.RPGTreasureID)
      : null;
    const data = {
      name: monster.Name,
      id: monster.ID,
      actions: this.getContent(monster.ActionsDescriptionContentID),
      longDescriptions: this.getContent(monster.LongDescriptionContentID),
      traits: this.getContent(monster.SpecialTraitsDescriptionContentID),
      reactions: this.getContent(monster.ReactionsDescriptionContentID),
      legendary: this.getContent(monster.LegendaryActionsDescriptionContentID),
      characteristics: this.getContent(monster.MonsterCharacteristicsDescriptionContentID),
      lair: this.getContent(monster.LairDescriptionContentID),
      bonus: this.getContent(monster.BonusActionsDescriptionContentID),
      mythic: this.getContent(monster.MythicActionsDescriptionContentID),
      gear: this.getContent(monster.GearDescriptionID),
      initiativeBonus: monster.InitiativeBonus,
      treasure: treasure,
    };
    this.data.push(data);

    const data2 = {
      name: data.name,
      id: data.id,
      gear: data.gear.map((g) => g.Value).join(", "),
      treasure: data.treasure ? data.treasure.Name : "",
      initiativeBonus: data.initiativeBonus,
    };

    this.sourceData.push(data2);
  }

  processMonsters() {
    for (const monster of this.monsters) {
      this.processMonster(monster);
    }
  }

  generateAdditionsMap() {
    const existingFiles = FileHelper.getFilePathsRecursively(this.destinationPath)
      .filter((f) => f.endsWith(".json"));
    
    let data = "const ADDITIONS_MAP =  {";
    for (const filePath of existingFiles) {
      const fileName = path.basename(filePath, ".json");
      const source = sources.find((s) => s.name.toLowerCase() === fileName.toLowerCase());
      if (source) {
        data += `\n  ${source.id}: require("./${fileName}.json"),`;
      }
    }
    data += `
};

function getAdditionsMap() {
  return ADDITIONS_MAP;
}

exports.getAdditionsMap = getAdditionsMap;
`;
    FileHelper.saveFile(data, path.join(this.destinationPath,"additions-map.js"));
    logger.info(`Exported additions map to ${path.join(this.destinationPath,"additions-map.js")}`);
  }

  write() {
    if (this.sourceData.length === 0) {
      logger.info("No monster data to export.");
      return;
    }
    if (!fs.existsSync(this.adventure.config.outputDir)) {
      fs.mkdirSync(this.adventure.config.outputDir);
    }
  
    this.adventure.config.data.subDirs.forEach((d) => {
      if (!fs.existsSync(path.join(this.adventure.config.outputDir,d))) {
        fs.mkdirSync(path.join(this.adventure.config.outputDir,d));
      }
    });
  
    logger.info("Exporting monster data...");

    // fs.writeFileSync(path.join(this.adventure.config.outputDir,"monster.json"), JSON.stringify(this.data));
    const filePath = path.join(this.destinationPath,`${this.adventure.bookCode}.json`);
    FileHelper.saveJSONFile(this.sourceData, filePath);
    logger.info(`Exported ${this.sourceData.length} monsters to ${filePath}`);
  }

  async process() {
    await this.load();
    this.processMonsters();
    this.write();
    this.generateAdditionsMap();
    this.db.closeDB();
  }

}

exports.Monsters = Monsters;
