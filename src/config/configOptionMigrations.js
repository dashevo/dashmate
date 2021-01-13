const lodashSet = require('lodash.set');

const systemConfigs = require('./systemConfigs/systemConfigs');

module.exports = {
  '0.17.2': (name, options) => {
    // Set seed nodes for tenderdash
    lodashSet(options, 'platform.drive.tenderdash.p2p.seeds', systemConfigs.testnet.platform.drive.tenderdash.p2p.seeds);
    lodashSet(options, 'platform.drive.tenderdash.p2p.persistentPeers', []);

    return options;
  },
};
