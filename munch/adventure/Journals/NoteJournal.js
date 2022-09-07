const { Journal } = require("./Journal");


class NoteJournal extends Journal {

  get folderType() {
    return "note";
  }

  get pageType() {
    return "text";
  }

  get section() {
    return false;
  }

  get note() {
    return true;
  }

  get forceAdd() {
    return true;
  }

  appendJournalToChapter() {
    // we don't append notes to chapters
  }

  generateTable() {
    // we don't generate tables for notes
  }

  constructor(adventure, row) {
    super(adventure, row);
  }

}

exports.NoteJournal = NoteJournal;

