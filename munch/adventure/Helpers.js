class Helpers {

  static sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static randomString(length, chars) {
    let mask = "";
    if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
    if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (chars.indexOf("#") > -1) mask += "0123456789";
    if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
    let result = "";
    for (let i = length; i > 0; --i)
      result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }
  
  static zeroPad(num, places) {
    return String(num).padStart(places, "0");
  }
  
  static SKIPPING_WORDS = ["the", "of", "at", "it", "a"];
  static REMOVE_STRINGS = [
    "View Without Grid",
    "View Player Version",
    "View Unlabeled Version"
  ];


  static titleString(text) {
    //if (!text || text === "") return "";
    for (let i = 0; i < this.REMOVE_STRINGS.length; i++) {
      text = text.replace(this.REMOVE_STRINGS[i], "");
    }
    const prefixSplit = text.replace("\r\n", " ").trim().split(":");
    const words
      = (prefixSplit.length > 1
        ? prefixSplit[1].trim().split(" ")
        : text.trim().split(" "))
        .filter((w) => w !== "");

    for (let i = 0; i < words.length; i++) {
      if (i == 0 || !Helpers.SKIPPING_WORDS.includes(words[i])) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
      }
    }
  
    const prefix = prefixSplit.length > 1 ? `${prefixSplit[0]}: ` : "";
  
    return prefix + words.join(" ");
  }

}

exports.Helpers = Helpers;
