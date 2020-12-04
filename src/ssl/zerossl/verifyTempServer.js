const { Observable } = require('rxjs');
const axios = require('axios');

async function queryTempServer(serverURL) {
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

/**
 * Setup temp server for ZeroSSL challenge
 *
 * @typedef {verifyTempServer}
 * @param {string} challengePath
 * @return {Promise<string>}
 */
async function verifyTempServer(
  challengeFile,
  externalIp,
) {
  // eslint-disable-next-line no-new
  new Observable(async (observer) => {
    const serverUrl = `http://${externalIp}/.well-known/pki-validation/${challengeFile}`;

    // I don't know if this is working...
    setTimeout(async () => {
      observer.next('Wait for server');
      await queryTempServer(serverUrl);
      observer.complete();
    }, 2000);
  });

  return undefined;
}

module.exports = verifyTempServer;
