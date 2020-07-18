var axios = require('axios');

/**
 * Download the certificate specified by id
 * 
 * @param {string} id 
 * @param {string} apiKey 
 */
async function downloadCertificate(id, apiKey) {
  var config = {
      method: 'get',
      url: 'https://api.zerossl.com/certificates/' + id + '/download/return?access_key=' + apiKey,
      headers: { },
    };
    
  const response = await axios(config)
  .catch(function (error) {
    console.log(error);
  });
  return response;   
}

module.exports = downloadCertificate