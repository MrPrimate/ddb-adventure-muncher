const { Journal } = require("./Journal");


class Note extends Journal {

  TYPE = "note";

  appendJournalToChapter() {
    // we don't append notes to chapters
  }

  addJournal() {
    super.addJournal(true);
  }

  getFolder() {
    super.getFolder(false, true);
  }

  generateTable(content) {
    // we don't generate tables for notes
  }

  constructor(adventure, row) {
    const flags = {
      note: true,
    }

    super(adventure, row, flags);
  }

}

exports.Note = Note;

