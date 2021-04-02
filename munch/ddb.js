const { DDB_CONFIG } = require("./ddb-config.js");
const fetch = require("node-fetch");
const fs = require("fs");

function ddbCall(url, urlencoded) {
  const options = {
    method: 'POST',
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: urlencoded,
    redirect: 'follow'
  };
  return new Promise((resolve, reject) => {
    fetch(url, options)
    .then(response => response.json())
    .then(result => {
      if (result.status === "success") {
        resolve(result.data);
      } else {
        console.log(`Error ${result}`);
        reject(result);
      }
    })
    .catch(error => {
      console.log('error', error);
      reject(error);
    });
  });
}

function downloadFile(url, destination) {
  const options = {
    url: url,
    encoding: null
  };

  return new Promise((resolve, reject) => {
    fetch(url, options)
    .then((res) => {
      const dest = fs.createWriteStream(destination);
      res.body.pipe(dest);
      res.body.on('end', () => resolve());
      dest.on('error', reject);
    })
    .catch(error => {
      console.log('error', error);
      reject(error);
    });
  });
}

async function getKey(bookId, cobalt) {
  try {
    const urlencoded = new URLSearchParams();
    urlencoded.append("token", `${cobalt}`);
    urlencoded.append("sources", `[{\"sourceID\":${bookId},\"versionID\":null}]`);

    const result = await ddbCall("https://www.dndbeyond.com/mobile/api/v5/book-codes", urlencoded);
    const buff = new Buffer.from(result.find((r) => r.sourceID == bookId).data, 'base64');
    const key = buff.toString('ascii');
    return key;
  } catch (error) {
    console.log(error)
  }
}

async function getBookUrl(bookId, cobalt) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("token", `${cobalt}`);
  const result = await ddbCall(`https://www.dndbeyond.com/mobile/api/v5/get-book-url/${bookId}`, urlencoded);
  return result;
}

async function downloadBook(bookId, cobalt, destination) {
  const url = await getBookUrl(bookId, cobalt);
  await downloadFile(url, destination);
  return true;
}

const BAD_IDS = [
  31, // CR data, file not found
  53, // SAC, file not found
  42, // TMR, file not found
];
async function listBooks(cobalt) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("token", `${cobalt}`);

  const result = await ddbCall("https://www.dndbeyond.com/mobile/api/v5/available-user-content", urlencoded);
  const books = result.Licenses.map((block) =>
    block.Entities
      .filter((b) => b.isOwned && !BAD_IDS.includes(b.id))
      .filter((b) => DDB_CONFIG.sources.some((s)  => b.id === s.id && s.isReleased))
      .map((b) => {
        const book = DDB_CONFIG.sources.find((s)  => b.id === s.id);
        return {
          id: b.id,
          book: book.description,
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

async function getUserData(cobalt) {
  const userData = {};
  return userData
}

exports.getKey = getKey;
exports.getBookUrl = getBookUrl;
exports.downloadBook = downloadBook;
exports.listBooks = listBooks;
exports.getUserData = getUserData;
