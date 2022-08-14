const logger = require("../logger.js");
const { Page } = require("./Journals/Page.js");


class JournalFactory {

  constructor(adventure) {
    this.adventure = adventure;

  }

}


exports.JournalFactory = JournalFactory;
