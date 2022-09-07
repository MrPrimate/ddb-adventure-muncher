const fetch = require("node-fetch");
const logger = require("../logger.js");
const bookData = require("./bookData.js");
const { FileHelper } = require("../adventure/FileHelper.js");

function ddbCall(url, urlencoded) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: urlencoded,
    redirect: "follow"
  };
  return new Promise((resolve, reject) => {
    fetch(url, options)
      .then(response => response.json())
      .then(result => {
        if (result.status === "success") {
          if (result.data) resolve(result.data);
          resolve(result);
        } else {
          logger.error("Error", result);
          reject(result);
        }
      })
      .catch(error => {
        logger.error("error", error);
        reject(error);
      });
  });
}

function getDDBConfig() {
  // const url = "https://www.dndbeyond.com/api/config/json";
  // const options = {
  //   method: "GET",
  //   headers: {
  //     "Sec-GPC": "1",
  //     "Accept": "*/*",
  //     "Accept-Language": "en-GB,en;q=0.5",
  //   },
  //   mode: "cors",
  // };
  // return new Promise((resolve, reject) => {
  //   fetch(url, options)
  //     .then(response => response.json())
  //     .then(result => {
  //       logger.info(result);
  //       resolve(result);
  //     })
  //     .catch(error => {
  //       logger.error("Error fetching book info from DDB");
  //       logger.error("error", error);
  //       reject(error);
  //     });
  // });
  return bookData;
}


async function getKey(bookId, cobalt) {
  try {
    const urlencoded = new URLSearchParams();
    urlencoded.append("token", `${cobalt}`);
    // eslint-disable-next-line no-useless-escape
    urlencoded.append("sources", `[{\"sourceID\":${bookId},\"versionID\":null}]`);

    const result = await ddbCall("https://www.dndbeyond.com/mobile/api/v6/book-codes", urlencoded);
    const buff = new Buffer.from(result.find((r) => r.sourceID == bookId).data, "base64");
    const key = buff.toString("ascii");
    return key;
  } catch (error) {
    logger.error(error);
  }
}

async function checkLatestBookVersion(bookId, cobalt, currentVersion) {
  const url = "https://www.dndbeyond.com/mobile/api/v6/do-higher-versions-exist";
  const urlencoded = new URLSearchParams();
  urlencoded.append("token", `${cobalt}`);
  const versions = {};
  versions[bookId] = currentVersion;
  urlencoded.append("sourceVersions", JSON.stringify(versions));
  urlencoded.append("manifestVersion", "0.0");
  const result = await ddbCall(url, urlencoded);
  return result;
}

async function getBookUrl(bookId, cobalt) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("token", `${cobalt}`);
  const result = await ddbCall(`https://www.dndbeyond.com/mobile/api/v6/get-book-url/${bookId}`, urlencoded);
  return result;
}

async function downloadBook(bookId, cobalt, destination, timeout = 30000) {
  logger.info(`Getting download link for ${bookId}`);
  const url = await getBookUrl(bookId, cobalt);
  logger.info("Generated unique download URL");
  await FileHelper.downloadFile(url, destination, timeout);
  logger.info("Download complete");
  return true;
}

const BAD_IDS = [
  31, // CR data, file not found
  53, // SAC, file not found
  42, // TMR, file not found
  29, // UA - no content
  4, // EE players
  26, //cos players
  30, //ddb
  14, // tftyp - appear as individual adventures
];
async function listBooks(cobalt, allBooks=true) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("token", `${cobalt}`);

  //  "EntityTypeID": 953599357 - this needs to be filtered out as it gives false positives
  // 496802664 is books
  // 953599357 dice sets
  const ddbConfig = await getDDBConfig();

  const result = await ddbCall("https://www.dndbeyond.com/mobile/api/v6/available-user-content", urlencoded);
  const books = result.Licenses.filter((f) => 
    f.EntityTypeID == "496802664"
  ).map((block) =>
    block.Entities
      .filter((b) => (allBooks || b.isOwned) && !BAD_IDS.includes(b.id))
      .filter((b) => ddbConfig.sources.some((s)  => b.id === s.id && s.isReleased))
      .map((b) => {
        const book = ddbConfig.sources.find((s)  => b.id === s.id);
        return {
          id: b.id,
          book: book,
          description: book.description,
          bookCode: book.name.toLowerCase(),
          bookCodeNormal: book.name,
        };
      })
  )
    .flat()
    .reduce((acc, current) => {
      const x = acc.find((book) => book.id == current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

  return books;
}

// {
//   "status": "success",
//   "userId": 111111111,
//   "userDisplayName": "XXXXX",
//   "twitchUserName": "XXXX",
//   "AvatarUrl": "https://media-waterdeep.cursecdn.com/avatars/thumbnails/3453/679/64/64/11111111.png"
// }
async function getUserData(cobalt) {
  try {
    const urlencoded = new URLSearchParams();
    urlencoded.append("token", `${cobalt}`);
    const result = await ddbCall("https://www.dndbeyond.com/mobile/api/v6/user-data", urlencoded);
    return result;
  } catch (e) {
    logger.error("Error:", e);
    return {
      error: true,
      message: "Unable to authenticate, check Cobalt value",
      e: e,
    };
  }
}

exports.getKey = getKey;
exports.getBookUrl = getBookUrl;
exports.downloadBook = downloadBook;
exports.listBooks = listBooks;
exports.getUserData = getUserData;
exports.getDDBConfig = getDDBConfig;
exports.checkLatestBookVersion = checkLatestBookVersion;
