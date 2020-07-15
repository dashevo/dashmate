var axios = require('axios');

/**
 * List ZeroSSL certificates
 * 
 * @param {string} apiKey 
 */
function listCertificates(apiKey) {
  var config = {
    method: 'get',
    url: 'api.zerossl.com/certificates?access_key=' + apiKey,
    headers: { }
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  }); 
}

module.exports = listCertificates