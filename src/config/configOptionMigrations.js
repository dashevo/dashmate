const lodashGet = require('lodash.get');
const lodashSet = require('lodash.set');

const systemConfigs = require('./systemConfigs/systemConfigs');

module.exports = {
  '0.17.2': (name, options) => {
    // Rename tendermint to tenderdash
    lodashSet(options, 'platform.dapi.nginx.https.port', 443);
    lodashSet(options, 'platform.dapi.grpcs.https.port', 1443);
    lodashSet(options, 'platform.dapi.ssl.provider', 'zerossl');
    lodashSet(options, 'platform.dapi.ssl.enable', false);
    lodashSet(options, 'platform.dapi.ssl.zerossl.apikey', null);
    return options;
  },
};
