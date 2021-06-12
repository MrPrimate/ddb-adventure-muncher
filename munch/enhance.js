const fetch = require("node-fetch");

async function getEnhancedData(config) {
  const cobaltCookie = config.cobalt;
  const enhancementEndpoint = config.run.enhancementEndpoint;
  const body = { cobalt: cobaltCookie, bookId: config.run.bookId };
  console.log(`Starting download enhanced data for ${config.run.bookCode}`);

  const disableEnhancedDownloads = (config.disableEnhancedDownloads) ? 
    config.disableEnhancedDownloads :
    false;

  return new Promise((resolve, reject) => {
    if (disableEnhancedDownloads) resolve([]);
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
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => {
        console.warn(`Failed to get enhanced data from ${enhancementEndpoint} for ${config.run.bookCode}`);
        reject(error);
      });
  });
}



exports.getEnhancedData = getEnhancedData;
