

class Page {

  constructor({name, content, flags, id, type = "text", level = 1}) {
    this.data = {
      name,
      type,
      title: {
        show: false,
        level,
      },
      _id: id,
      text: {
        format: 1,
      },
      video: {
        controls: true,
        volume: 0.5,
      },
      image: {},
      src: null,
      sort: 0,
      ownership: {
        default: -1,
      },
      flags,
    };

    switch (type) {
      case "text": {
        this.data.text.content = content;
        break;
      }
      case "image": {
        this.data.title.show = true;
        this.data.src = content;
        break;
      }
      case "pdf": {
        this.data.src = content;
        break;
      }
      // no default
    }
  }

  // check to see if I need to override the defaults
  toJson() {
    return JSON.stringify(this.data);
  }

  toObject() {
    return JSON.parse(this.toJson());
  }
}

exports.Page = Page;
