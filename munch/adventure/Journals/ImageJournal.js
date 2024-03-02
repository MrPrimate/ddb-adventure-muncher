const logger = require("../../logger.js");
const { Journal } = require("./Journal");


class ImageJournal extends Journal {

  get folderType() {
    return "image";
  }

  get pageType() {
    return "image";
  }

  get section() {
    return false;
  }

  get image() {
    return true;
  }
 
  appendJournalToChapter() {
    // we don't append images to chapters
  }

  generateTable() {
    // we don't generate tables for images
  }

  fixUp() {
    // we don't need to fix image journals
  }

  generateContentLinks() {
    this.contentChunkIds[this.data._id] = new Set([]);
    this.elementIds[this.data._id] = new Set([]);
  }

  replaceImgLinksForJournal() {
    // eslint-disable-next-line no-useless-escape
    const reImage = new RegExp(`^\.\/${this.adventure.bookCode}\/`, "g");
    const text1 = this.imagePath.replace(reImage, "assets/");
    // eslint-disable-next-line no-useless-escape
    const reImage2 = new RegExp(`^${this.adventure.bookCode}\/`, "g");
    const text2 = text1.replace(reImage2, "assets/");
  
    return text2;
  }


  // we check the generated assets to see if this asset is unique (so far)
  isDuplicate() {
    return this.adventure.assets.includes(this.imageContent);
  }

  _generateJournalEntryShared() {
    if (!this.duplicate) {
      if (this.adventure.config.data.imageFind) {
        this.adventure.imageFinder.journals.push({
          bookCode: this.adventure.bookCode,
          img: this.imageContent,
          name: this.row.name,
          slug: this.row.slug,
        });
      }
    }
    this.adventure.assets.push(this.imageContent);
    const journalHandoutCount = this.adventure.assets.filter(img => img === this.imageContent).length;
    logger.debug(`Generated Handout ${this.row.name}, "${this.imageContent}", (count ${journalHandoutCount}), Duplicate? ${this.duplicate}`);

  }

  _generateJournalEntryWithPages() {
    if (this.duplicate) {
      const journalMatch =  this.adventure.journals.map((j) => j.data.pages).flat().find((j) => j.src === this.imageContent);
      this.data.flags.ddb.linkId = journalMatch ? journalMatch._id : null;
      this.data.flags.ddb.linkName = journalMatch ? journalMatch.name : null;
    }
    this._generateJournalEntryShared();

    const page = this.generatePage(this.imageContent);

    if (!this.row.parentId) this.data.flags.ddb.linkId = this.data._id;
    this.data.pages.push(page);

  }

  _additionalConstruction({ imagePath }) {
    this.imagePath = imagePath;
    this.imageContent = this.replaceImgLinksForJournal();
    this.data.flags.ddb.imageSrc = this.imageContent;
  }

  constructor(adventure, row, imagePath) {
    super(adventure, row, { imagePath });
  }
}

exports.ImageJournal = ImageJournal;
