var axios = require('axios');

/**
 * Verify if the temp server is up
 * 
 * @param {string} serverURL 
 */
async function verifyTempServer(serverURL) {
  var config = {
    method: 'get',
    url: serverURL,
    headers: { }
  };
  
  const response = await axios(config)
  .catch(function (error) {
    console.log(error);
  });
  return response; 
}

module.exports = verifyTempServer