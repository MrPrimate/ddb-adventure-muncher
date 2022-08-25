const utils = require("./utils.js");
const fetch = require("node-fetch");
const semver = require("semver");
const path = require("path");
const logger = require("./logger.js");
const fs = require("fs");

async function getEnhancedData(config) {
  const cobaltCookie = config.cobalt;
  const enhancementEndpoint = config.enhancementEndpoint;
  const body = { cobalt: cobaltCookie, bookId: config.book.id };
  logger.info(`Starting download enhanced data for ${config.bookCode}`);

  const disableEnhancedDownloads = (config.disableEnhancedDownloads) ? 
    config.disableEnhancedDownloads :
    false;

  return new Promise((resolve, reject) => {
    if (disableEnhancedDownloads) {
      logger.warn("Enhanced downloads disabled");
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
          logger.error(`Proxy response failure: ${data.message}`);
          if (data.message === `Unknown error during item loading: No info for book ${config.book.id} yet` ||
            data.message === `Unknown error during item loading: No info for book ${config.bookCode} yet`
          ) {
            logger.error(`No enhanced data for ${config.bookCode}`);
            resolve([]);
          } else {
            reject(data.message);
          }
        }
        logger.info(`Successfully received enhanced data for ${config.bookCode} containing ${data.data.length} items`);
        return data;
      })
      .then((data) => resolve(data.data))
      .catch(() => {
        logger.error(`Failed to get enhanced data from ${enhancementEndpoint} for ${config.bookCode}`);
        resolve([]);
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
    return utils.downloadFile(asset.browser_download_url, path.join(config.metaDir, asset.name), config.downloadTimeout);
  });

  await Promise.all(downloads).then((downloadFiles) => {
    results.downloaded = downloadFiles;
  });

  const unzipped = results.downloaded.map((downloadFile) => {
    logger.info(`Unzipping ${downloadFile}`);
    return utils.unzipFile(downloadFile, config.metaDir);
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

  const versionsPath = path.join(config.metaDir, "versions.json");
  const metaPath = path.join(config.metaDir, "meta.json");
  const versionsFileExists = fs.existsSync(versionsPath);
  const metaFileExists = fs.existsSync(metaPath);


  return new Promise((resolve, reject) => {
    fetch(githubApiLatest, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        //logger.info(data);
        logger.info(semver.clean(data.tag_name)); 
        logger.info(`Found remote metadata version: ${semver.valid(semver.clean(data.tag_name))}`); 
        if (semver.valid(semver.clean(data.tag_name)) || !versionsFileExists || !metaFileExists) {
          return data;
        } else {
          resolve(config.metaDataVersion);
        }
      })
      .then((data) => {
        const latestVersion = semver.clean(data.tag_name);
        const noCurrent = semver.valid(config.metaDataVersion) === null;
        const currentVersion = !noCurrent ? semver.clean(config.metaDataVersion) : "0.0.0";
        logger.info(`Current metadata version: ${currentVersion}`);
        if (semver.gt(latestVersion, currentVersion) || !versionsFileExists || !metaFileExists) {
          logger.info("Downloading new metadata");
          const downloadVersion = downloadMetaData(data, config)
            .then((result) => {
              logger.info(result);
              return result.version;
            })
            .catch((error) => {
              logger.error(`Failed to download data from ${githubApiLatest} for ${data.zipball_url}`);
              reject(error);
            });
          return downloadVersion;
        } else {
          return currentVersion;
        }
      })
      .then((version) => resolve(version))
      .catch((error) => {
        logger.error(`Failed to get meta data from ${githubApiLatest}`);
        reject(error);
      });
  });

}


exports.getEnhancedData = getEnhancedData;
exports.getMetaData = getMetaData;
