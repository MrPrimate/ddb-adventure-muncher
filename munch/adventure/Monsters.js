const logger = require("../logger.js");

const { Database } = require("./Database.js");

const fs = require("fs");
const path = require("path");



class Monsters {

  constructor(adventure) {
    this.adventure = adventure;
    this.monsters = [];

    this.data = [];
    this.sourceData = [];
    this.db = new Database(this.adventure);
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

  async write() {
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
    fs.writeFileSync(path.join(this.adventure.config.outputDir,`${this.adventure.bookCode}.json`), JSON.stringify(this.sourceData));
  }

  async process() {
    await this.load();
    this.processMonsters();
    await this.write();
    this.db.closeDB();
  }

}

exports.Monsters = Monsters;
