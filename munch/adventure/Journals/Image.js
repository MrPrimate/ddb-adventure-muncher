const logger = require("../../logger.js");
const { Journal } = require("./Journal");


class Image extends Journal {

  TYPE = "image";
  PAGE_TYPE = "image";

  appendJournalToChapter() {
    // we don't append images to chapters
  }

  generateTable(content) {
    // we don't generate tables for images
  }

  replaceImgLinksForJournal() {
    const reImage = new RegExp(`^\.\/${this.adventure.bookCode}\/`, "g");
    const text1 = this.imagePath.replace(reImage, "assets/");
    const reImage2 = new RegExp(`^${this.adventure.bookCode}\/`, "g");
    const text2 = text1.replace(reImage2, "assets/");
  
    return text2;
  }

  _generateJournalEntryV10() {

    if (this.adventure.config.observeAll) this.data.ownership.default = 2;

    let content = replacer.replaceImgLinksForJournal();
    this.data.flags.ddb.imageSrc = content;
    if (this.adventure.assets.includes(content)) {
      const journalMatch =  generatedJournals.map((j) => j.pages).flat().find((j) => j.src === content);
      this.data.flags.ddb.duplicate = true;
      this.data.flags.ddb.linkId = journalMatch ? journalMatch._id : null;
      this.data.flags.ddb.linkName = journalMatch ? journalMatch.name : null;
    } else {
      this.data.flags.ddb.duplicate = false;
      this.data.flags.ddb.linkName = this.row.name;
      if (this.adventure.config.imageFind) {
        this.adventure.imageFinder.journalResults.push({
          bookCode: this.adventure.bookCode,
          img: content,
          name: this.row.name,
          slug: this.row.slug,
        });
      }
    }
    this.adventure.assets.push(content);
    const journalHandoutCount = this.adventure.assets.filter(img => img === content).length;
    logger.info(`Generated Handout ${this.row.name}, "${content}", (count ${journalHandoutCount}), Duplicate? ${this.data.flags.ddb.duplicate}`);

    const page = this.generatePage(content);

    if (!this.row.parentId) this.data.flags.ddb.linkId = this.data._id;
    this.data.pages.push(page);

  }

  _generateJournalEntryOld() {
    if (this.adventure.config.observeAll) this.data.permission.default = 2;

    this.data.img = replacer.replaceImgLinksForJournal();

    if (this.adventure.assets.includes(this.data.img)) {
      this.data.flags.ddb.imageSrc = this.data.img;
      const journalMatch = generatedJournals.find((j) => j.img === this.data.img);
      this.data.flags.ddb.duplicate = true;
      this.data.flags.ddb.linkId = journalMatch ? journalMatch._id : null;
      this.data.flags.ddb.linkName = journalMatch ? journalMatch.name : null;
    } else {
      this.data.flags.ddb.duplicate = false;
      this.data.flags.ddb.linkName = this.data.name;
      if (config.imageFind) {
        this.adventure.imageFinder.journalResults.push({
          bookCode: this.adventure.bookCode,
          img: this.data.img,
          name: this.data.name,
          slug: this.row.slug,
        });
      }
    }
    this.adventure.assets.push(this.data.img);
    const journalHandoutCount = this.adventure.assets.filter(img => img === this.data.img).length;
    logger.info(`Generated Handout ${this.data.name}, "${this.data.img}", (count ${journalHandoutCount}), Duplicate? ${this.data.flags.ddb.duplicate}`);

    this.data.flags.ddb.linkId = this.data._id;

  }

  constructor(adventure, row, imagePath) {
    const flags = {
      img: true,
    }
    this.section = false;
    this.imagePath = imagePath;

    super(adventure, row, flags);
  }
}

exports.Image = Image;
