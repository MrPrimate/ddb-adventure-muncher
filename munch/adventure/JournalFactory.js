const logger = require("../logger.js");
const Journal = require("./Journals/Journal.js");
const ImageJournal = require("./Journals/ImageJournal.js");
const NoteJournal = require("./Journals/NoteJournal.js");

class JournalFactory {

  constructor(adventure) {
    this.adventure = adventure;

  }

}


exports.JournalFactory = JournalFactory;


addJournal() {
  const validType = this.forceAdd || this.createHandouts || this.createSections;

  // we never add duplicates
  // return !this.duplicate && validType;
  if (!this.duplicate && validType) {
    logger.info(`Appending ${this.row.title} ${this.type} Journal"`);
    this.adventure.journals.push(this);
  }
}
