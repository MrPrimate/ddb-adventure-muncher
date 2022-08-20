const logger = require("../logger.js");
const { Journal } = require("./Journals/Journal.js");
const { ImageJournal } = require("./Journals/ImageJournal.js");
const { NoteJournal } = require("./Journals/NoteJournal.js");

class JournalFactory {

  constructor(adventure) {
    this.adventure = adventure;

  }

  createJournal(row) {
    const journal = new Journal(this.adventure, row);

    const validType = journal.forceAdd || journal.createHandouts || journal.createSections;
    // we never add duplicates
    // return !this.duplicate && validType;
    if (!journal.duplicate && validType) {
      logger.info(`Appending ${row.title} ${journal.TYPE} Journal"`);
      this.adventure.journals.push(journal);
    }
  }

  // this is called once all journals are created to update links etc
  fixUpJournals() {
    this.adventure.journals.forEach((journal) => {
      journal.fixUp();
      if (global.gc) global.gc();
    })
  }

}


exports.JournalFactory = JournalFactory;
