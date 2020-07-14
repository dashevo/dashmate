var axios = require('axios');
var qs = require('qs');

function verifyDomain(id,apiKey) {
    var data = qs.stringify({
        'validation_method': 'HTTP_CSR_HASH' 
       });
       var config = {
         method: 'post',
         url: 'api.zerossl.com/certificates/' + id + '/challenges?access_key=' + apiKey,
         headers: { 
           'Content-Type': 'application/x-www-form-urlencoded'
         },
         data : data
       };
       
       axios(config)
       .then(function (response) {
         console.log(JSON.stringify(response.data));
       })
       .catch(function (error) {
         console.log(error);
       });   
}

module.exports = verifyDomain