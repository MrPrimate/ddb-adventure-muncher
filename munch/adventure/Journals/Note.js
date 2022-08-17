const { Journal } = require("./Journal");


class Note extends Journal {

  TYPE = "note";
  PAGE_TYPE = "text";

  appendJournalToChapter() {
    // we don't append notes to chapters
  }

  addJournal() {
    super.addJournal(true);
  }

  generateTable(content) {
    // we don't generate tables for notes
  }

  constructor(adventure, row) {
    const flags = {
      note: true,
    }
    this.section = false;
    super(adventure, row, flags);
  }

}

exports.Note = Note;

