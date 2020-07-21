const axios = require('axios');

/**
 * Download the certificate specified by id
 *
 * @param {string} id
 * @param {string} apiKey
 */
async function downloadCertificate(id, apiKey) {
  const config = {
    method: 'get',
    url: `https://api.zerossl.com/certificates/${id}/download/return?access_key=${apiKey}`,
    headers: { },
  };

  const response = await axios(config)
    .catch((error) => {
      throw new Error(error);
    });
  return response;
}

module.exports = downloadCertificate;
