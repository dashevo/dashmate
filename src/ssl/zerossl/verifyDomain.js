var axios = require('axios');
var qs = require('qs');

/**
 * Verify the domain/ip specified by certificate id
 * 
 * @param {string} id 
 * @param {string} apiKey 
 */
async function verifyDomain(id,apiKey) {
  var data = qs.stringify({
  'validation_method': 'HTTP_CSR_HASH' 
  });
  
  var config = {
    method: 'post',
    url: 'https://api.zerossl.com/certificates/' + id + '/challenges?access_key=' + apiKey,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };
       
  const response = await axios(config)
  .catch(function (error) {
    console.log(error);
  });
  return response;  
}

module.exports = verifyDomain