const lodashSet = require('lodash.set');

const systemConfigs = require('./systemConfigs/systemConfigs');
const NETWORKS = require('../networks');

module.exports = {
  '0.17.2': (name, options) => {
    if (options.network !== NETWORKS.TESTNET) {
      return options;
    }

    // Set seed nodes for testnet tenderdash
    lodashSet(options, 'platform.drive.tenderdash.p2p.seeds', systemConfigs.testnet.platform.drive.tenderdash.p2p.seeds);
    lodashSet(options, 'platform.drive.tenderdash.p2p.persistentPeers', []);

    return options;
  },
  '0.17.3': (name, options) => {
    if (options.network !== NETWORKS.TESTNET) {
      return options;
    }

    // Set DashPay contract ID and block height for testnet
    lodashSet(options, 'platform.dashpay', systemConfigs.testnet.platform.dashpay);

    return options;
  },
  '0.17.4': (name, options) => {
    if (options.network !== NETWORKS.TESTNET) {
      return options;
    }

    // Set Drive's new logging variables
    lodashSet(options, 'platform.drive.abci.log.stdout.level', systemConfigs.baseConfig.platform.drive.abci.log.stdout.level);
    lodashSet(options, 'platform.drive.abci.log.pretty.level', systemConfigs.baseConfig.platform.drive.abci.log.pretty.level);
    lodashSet(options, 'platform.drive.abci.log.pretty.filePath', systemConfigs.baseConfig.platform.drive.abci.log.pretty.filePath);
    lodashSet(options, 'platform.drive.abci.log.json.level', systemConfigs.baseConfig.platform.drive.abci.log.json.level);
    lodashSet(options, 'platform.drive.abci.log.json.filePath', systemConfigs.baseConfig.platform.drive.abci.log.json.filePath);

    return options;
  },
};
