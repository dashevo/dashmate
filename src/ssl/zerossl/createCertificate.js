const axios = require('axios');
const qs = require('qs');

/**
 * Create a ZeroSSL Certificate
 *
 * @typedef {createNewAddress}
 * @param {string} apiKey
 * @param {string} domain
 */
async function createCertificate(apiKey, domain, csr) {
  const data = qs.stringify({
    certificate_domains: domain,
    certificate_validity_days: '90',
    certificate_csr: csr,
  });
  
  var config = {
    method: 'post',
    url: 'https://api.zerossl.com/certificates?access_key=' + apiKey,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };
  
  const response = await axios(config)
  .catch(function (error) {
    throw new Error(error);
  });
  
  return response;   
}

module.exports = createCertificate