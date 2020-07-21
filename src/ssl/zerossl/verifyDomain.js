const axios = require('axios');
const qs = require('qs');

/**
 * Verify the domain/ip specified by certificate id
 *
 * @param {string} id
 * @param {string} apiKey
 */
async function verifyDomain(id, apiKey) {
  const data = qs.stringify({
    validation_method: 'HTTP_CSR_HASH',
  });

  const config = {
    method: 'post',
    url: `https://api.zerossl.com/certificates/${id}/challenges?access_key=${apiKey}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data,
  };

  const response = await axios(config)
    .catch((error) => {
      throw new Error(error);
    });
  return response;
}

module.exports = verifyDomain;
