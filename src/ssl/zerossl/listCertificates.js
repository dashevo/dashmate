var axios = require('axios');

/**
 * List ZeroSSL certificates
 * 
 * @param {string} apiKey 
 */
async function listCertificates(apiKey) {
  var config = {
    method: 'get',
    url: 'https://api.zerossl.com/certificates?access_key=' + apiKey,
    headers: { }
  };
  
  const response = await axios(config)
  .catch(function (error) {
    console.log(error);
  });
  return response; 
}

module.exports = listCertificates