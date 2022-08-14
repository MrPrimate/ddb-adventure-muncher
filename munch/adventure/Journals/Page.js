

class Page {

  constructor({name, content, flags, id, type = "text", level = 1}) {
    this.name = name;
    this.type = type;
    this.title = {
      show: false,
      level,
    };

    this._id = id;
    this.text = {
      format: 1,
    };
    this.video = {
      controls: true,
      volume: 0.5,
    };
    this.image = {};
    this.src = null;
    this.sort = 0;
    this.ownership = {
      default: -1,
    };
    this.flags= flags;

    switch (type) {
      case "text": {
        this.text.content = content;
        break;
      }
      case "image": {
        this.title.show = true;
        this.src = content;
        break;
      }
      case "pdf": {
        this.src = content;
        break;
      }
      //no default
    }
  }

  // check to see if I need to override the defaults
  toJson() {
    return JSON.stringify(this);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }
}

exports.Page = Page;
