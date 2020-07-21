const axios = require('axios');

/**
 * Verify if the temp server is up
 *
 * @param {string} serverURL
 */
async function verifyTempServer(serverURL) {
  const config = {
    method: 'get',
    url: serverURL,
    headers: { },
  };

  const response = await axios(config)
    .catch((error) => {
      throw new Error(error);
    });
  return response;
}

module.exports = verifyTempServer;
