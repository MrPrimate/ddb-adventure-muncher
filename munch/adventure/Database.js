const sqlite3 = require("better-sqlite3-multiple-ciphers");
const path = require("path");
const logger = require("../logger.js");
const { Row } = require("./Row.js");

class Database {

  static getAllSQL = `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
`;

  static getChaptersSQL = `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
WHERE CobaltID IS NOT NULL
`;

  static getChapterContentSQL(cobaltId) {
    return `
SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html
FROM Content
WHERE ParentId = '${cobaltId}'
`;
  }

  static getMonstersSQL = `
SELECT *
FROM RPGMonster;
`;

  static getMonstersTreasureMapping = `
SELECT *
FROM RPGMonsterTreasureMapping
`;

  static getMonsterTreasures = `
SELECT *
FROM RPGTreasure
`;

  static getContentDetailByContentId(contentId) {
    return `
SELECT *
FROM ContentDetail
WHERE ContentID = '${contentId}'
`;
  }

  constructor(adventure) {
    this.adventure = adventure;
    this.options = {
      readonly: true,
      fileMustExist: true,
    };
    this.dbPath = path.join(this.adventure.config.sourceDir,`${this.adventure.bookCode}.db3`);
    this.db = null;
  }

  loadDB () {
    const db = new sqlite3(this.dbPath, this.options);

    db.pragma("cipher='sqlcipher'");
    db.pragma("legacy=3");
    db.pragma(`key='${this.adventure.config.key}'`);
    db.pragma("cipher_page_size='1024'");
    db.pragma("kdf_iter='64000'");
    db.pragma("cipher_hmac_algorithm='HMAC_SHA1'");
    db.pragma("cipher_kdf_algorithm='PBKDF2_HMAC_SHA1'");

    this.db = db;
  }

  closeDB() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  query(sql){
    if (!this.db) return new Error("Database not loaded");
  
    const results = [];
    try {
      const statement = this.db.prepare(sql);
      results.push(...statement.all());  
    } catch (err) {
      logger.error(err);
      logger.error(err.stack);
    }
    return results;
  }

  getData(){
    this.loadDB();
    logger.debug(this.db);
  
    try {
      const statement = this.db.prepare(Database.getAllSQL);
      const rows = statement.all();

      for (const row of rows) {
        const data = {
          id: row.id,
          title: `${row.title}`,
          parentId: row.parentId,
          cobaltId: row.cobaltId,
          slug: `${row.slug}`,
        };
        this.adventure.rowHints.rows.push(data);
        if (row.cobaltId ?? row.cobaltId != null)
          this.adventure.rowHints.parents.push(data);
      }

      for (const row of rows) {
        const rowObject = new Row(this.adventure, row);
        this.adventure.processRow(rowObject);
      }
      // this.finishedFunction(statement.length);
  
    } catch (err) {
      logger.error(err);
      logger.error(err.stack);
    }
    this.closeDB();
  }
}

exports.Database = Database;
