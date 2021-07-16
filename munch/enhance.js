const utils = require("./utils.js");
const fetch = require("node-fetch");
const semver = require("semver");
const path = require("path");

async function getEnhancedData(config) {
  const cobaltCookie = config.cobalt;
  const enhancementEndpoint = config.run.enhancementEndpoint;
  const body = { cobalt: cobaltCookie, bookId: config.run.book.id };
  console.log(`Starting download enhanced data for ${config.run.bookCode}`);

  const disableEnhancedDownloads = (config.disableEnhancedDownloads) ? 
    config.disableEnhancedDownloads :
    false;

  return new Promise((resolve, reject) => {
    if (disableEnhancedDownloads) {
      console.log("Enhanced downloads disabled");
      resolve([]);
    } 
    fetch(`${enhancementEndpoint}/proxy/adventure/enhancement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          console.log(`Failure: ${data.message}`);
          reject(data.message);
        }
        console.log(`Successfully received enhanced data for ${config.run.bookCode} containing ${data.data.length} items`);
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => {
        console.warn(`Failed to get enhanced data from ${enhancementEndpoint} for ${config.run.bookCode}`);
        reject(error);
      });
  });
}


async function downloadMetaData(data, config) {
  let results = {
    version: data.tag_name,
    downloaded: [],
    unzipped: [],
  };

  const downloads = data.assets.map((asset) => {
    return utils.downloadFile(asset.browser_download_url, path.join(config.run.metaDir, asset.name));
  });

  await Promise.all(downloads).then((downloadFiles) => {
    results.downloaded = downloadFiles;
  });

  const unzipped = results.downloaded.map((downloadFile) => {
    console.log(`Unzipping ${downloadFile}`);
    return utils.unzipFile(downloadFile, config.run.metaDir);
  });

  await Promise.all(unzipped).then((unzippedFiles) => {
    results.unzipped = unzippedFiles;
  });
  return results;
}

function getMetaData(config) {
  const metaDataRepoName = (process.env.METADATA_NAME) ? process.env.METADATA_NAME : "ddb-meta-data";
  const metaDataRepoAuthor = (process.env.METADATA_AUTHOR) ? process.env.METADATA_AUTHOR : "MrPrimate";
  const githubApiLatest = `https://api.github.com/repos/${metaDataRepoAuthor}/${metaDataRepoName}/releases/latest`;


  return new Promise((resolve, reject) => {
    fetch(githubApiLatest, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        console.log(semver.clean(data.tag_name)); 
        console.log(`Found remote metadata version: ${semver.valid(semver.clean(data.tag_name))}`); 
        if (semver.valid(semver.clean(data.tag_name))) {
          return data;
        } else {
          resolve(config.metaDataVersion);
        }
      })
      .then((data) => {
        const latestVersion = semver.clean(data.tag_name);
        const noCurrent = semver.valid(config.metaDataVersion) === null;
        const currentVersion = !noCurrent ? semver.clean(config.metaDataVersion) : "0.0.0";
        console.log(`Current metadata version: ${currentVersion}`);
        if (semver.gt(latestVersion, currentVersion)) {
          console.log("Downloading new metadata");
          const downloadVersion = downloadMetaData(data, config)
            .then((result) => {
              console.log(result);
              return result.version;
            })
            .catch((error) => {
              console.warn(`Failed to download data from ${githubApiLatest} for ${data.zipball_url}`);
              reject(error);
            });
          return downloadVersion;
        } else {
          return currentVersion;
        }
      })
      .then((version) => resolve(version))
      .catch((error) => {
        console.warn(`Failed to get meta data from ${githubApiLatest}`);
        reject(error);
      });
  });

}


exports.getEnhancedData = getEnhancedData;
exports.getMetaData = getMetaData;
