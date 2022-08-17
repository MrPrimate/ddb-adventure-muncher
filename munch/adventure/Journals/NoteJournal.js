const { Journal } = require("./Journal");


class NoteJournal extends Journal {

  TYPE = "note";
  PAGE_TYPE = "text";

  get section() {
    return false;
  }

  get note() {
    return true;
  }

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
    super(adventure, row);
  }

}

exports.Note = NoteJournal;

