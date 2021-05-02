const fetch = require("node-fetch");

async function getEnhancedData(config) {
    const cobaltCookie = config.cobalt;
    const enhancementEndpoint = config.run.enhancementEndpoint;
    const body = { cobalt: cobaltCookie, bookId: config.run.bookId };

    return new Promise((resolve, reject) => {
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
            .catch((error) => reject(error));
    });
}



exports.getEnhancedData = getEnhancedData;
