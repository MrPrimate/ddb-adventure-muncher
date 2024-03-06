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

  constructor(adventure) {
    this.adventure = adventure;
  }

  getData(){

    const options = {
      readonly: true,
      fileMustExist: true,
    };
    const dbPath = path.join(this.adventure.config.sourceDir,`${this.adventure.bookCode}.db3`);
    const db = new sqlite3(dbPath, options);
  
    db.pragma("cipher='sqlcipher'");
    db.pragma("legacy=3");
    db.pragma(`key='${this.adventure.config.key}'`);
    db.pragma("cipher_page_size='1024'");
    db.pragma("kdf_iter='64000'");
    db.pragma("cipher_hmac_algorithm='HMAC_SHA1'");
    db.pragma("cipher_kdf_algorithm='PBKDF2_HMAC_SHA1'");
  
    logger.debug(db);
  
    try {
      const statement = db.prepare(Database.getAllSQL);
      const rows = statement.all();
  
      for (const row of rows) {
        this.adventure.rowHints.rows.push({
          id: row.id,
          title: `${row.title}`,
          parentId: row.parentId,
          cobaltId: row.cobaltId,
        });
        const rowObject = new Row(this.adventure, row);
        this.adventure.processRow(rowObject);
      }
      // this.finishedFunction(statement.length);
  
    } catch (err) {
      logger.error(err);
      logger.error(err.stack);
    }
    db.close();
  }
}

exports.Database = Database;
