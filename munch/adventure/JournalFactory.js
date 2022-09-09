const logger = require("../logger.js");
const { Journal } = require("./Journals/Journal.js");
const { ImageJournal } = require("./Journals/ImageJournal.js");
const { NoteJournal } = require("./Journals/NoteJournal.js");

class JournalFactory {

  constructor(adventure) {
    this.adventure = adventure;
  }

  generateOtherFilesJournal() {
    logger.warn("Other Files", this.adventure.otherFiles);
  }

  createJournal(row) {
    const journal = new Journal(this.adventure, row);
    this.addJournal(journal, row);
    return journal;
  }

  createImageJournal(row, img) {
    const journal = new ImageJournal(this.adventure, row, img);
    this.addJournal(journal, row);
    return journal;
  }

  createNoteJournal(row) {
    const journal = new NoteJournal(this.adventure, row);
    this.addJournal(journal, row);
    return journal;
  }

  addJournal(journal) {
    const validType = journal.forceAdd || journal.createHandouts || journal.createSections;
    // we never add duplicates
    // return !this.duplicate && validType;
    if (!journal.duplicate && validType) {
      logger.info(`Appending ${journal.row.data.title} ${journal.TYPE} Journal"`);
      this.adventure.journals.push(journal);
    }
  }

  // this is called once all journals are created to update links etc
  fixUpJournals() {
    this.adventure.journals.forEach((journal) => {
      journal.fixUp();
      if (global.gc) global.gc();
    });
  }

}


exports.JournalFactory = JournalFactory;
