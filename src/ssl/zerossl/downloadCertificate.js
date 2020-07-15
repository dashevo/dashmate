var axios = require('axios');

/**
 * Download the certificate specified by id
 * 
 * @param {string} id 
 * @param {string} apiKey 
 */
function downloadCertificate(id, apiKey) {
    var config = {
        method: 'get',
        url: 'api.zerossl.com/certificates/' + id + '/download/return?access_key=' + apiKey,
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

module.exports = downloadCertificate