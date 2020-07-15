var axios = require('axios');
var qs = require('qs');

/**
 * Create a ZeroSSL Certificate
 * 
 * @typedef {createNewAddress}
 * @param {string} apiKey 
 * @param {string} domain 
 */
async function createCertificate(apiKey, domain) {
    var data = qs.stringify({
        'certificate_domains': domain,
        'certificate_validity_days': '90',
        'certificate_csr': '-----BEGIN CERTIFICATE REQUEST-----\nMIICtDCCAZwCAQAwbzELMAkGA1UEBhMCVVMxEzARBgNVBAMMCmRvbWFpbi5jb20x\nFDASBgNVBAcMC1NhbiBBbnRvbmlvMREwDwYDVQQKDAhCaWcgQm9iczEOMAwGA1UE\nCAwFVGV4YXMxEjAQBgNVBAsMCU1hcmtldGluZzCCASIwDQYJKoZIhvcNAQEBBQAD\nggEPADCCAQoCggEBAOI8m9Ya3BPFl9AaR3aQ5Fm88PYsKJyHLhffiFgzP0lbSQGD\nnIkE5cfYaivV8QPsARpWyyy+Csqhm869YrF0ENYlfSw6s4PELSgkxTFFR9gHGlyV\ng9I6K4LSMpYi5jvDUJm8d0o9PqsbzY63TrH/qiGsMfWTK39pCYoLQtDkHz1Y2JBL\nLLmJuD6ddydN2g9TFsQu+6OOHfCBxNmDHfW/zXPRM+r9Q9yZP48mDv8UCYQylVCY\nRjebme/6fCOgQtQd6nEBGYw+rArdqV1FzqL2Yw+twh7v+3GZLSx0vyAFVtynOhEE\neUsX0J5qnc9KaasCqp2F4/gWobzrofLKG2aGUzUCAwEAAaAAMA0GCSqGSIb3DQEB\nCwUAA4IBAQCkSnPuz7HZG5g0lawJ3nm5rd6VEvv74JK3md6KqKS3yFF+GLLhRcQZ\naRwsmlp8TI1Ndh3XOHW702Rm7SxZbprQlt4rQmF6NHrlFS5AbxUWqRWR6baS5Bvr\nto3hGVNlIBEL6FXZnVaDQZz/LtOQI9dAbruSd7VYe8MwIi0rjIKcH3eymy+exb2V\nDYyY88uWMqstURLBCEpJ6hZLCb36wkYnOmx24FIYHweeNVJRfshrZtG1yzECpHKy\nEIT8z30XzxogrZvQXK54Tr9389qtft70ys7rUdvf8BYSSkAuEXVYBH+BgWY/4o3h\nsQVvMvhgY0VnX+RcQzfQPBJh69yEm7j3\n-----END CERTIFICATE REQUEST-----' 
        });
        var config = {
          method: 'post',
          url: 'api.zerossl.com/certificates?access_key=' + apiKey,
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

module.exports = createCertificate