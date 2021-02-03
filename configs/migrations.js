/* eslint-disable no-param-reassign */
const lodashSet = require('lodash.set');

const systemConfigs = require('./systemConfigs');
const NETWORKS = require('../src/networks');

module.exports = {
  '0.17.2': (configFile) => {
    configFile.configs.filter((config) => config.network === NETWORKS.TESTNET)
      .forEach((config) => {
        // Set DashPay contract ID and block height for testnet
        // Set seed nodes for testnet tenderdash
        lodashSet(config, 'platform.drive.tenderdash.p2p.seeds', systemConfigs.testnet.platform.drive.tenderdash.p2p.seeds);
        lodashSet(config, 'platform.drive.tenderdash.p2p.persistentPeers', []);
      });

    return configFile;
  },
  '0.17.3': (configFile) => {
    configFile.configs.filter((config) => config.network === NETWORKS.TESTNET)
      .forEach((config) => {
        // Set DashPay contract ID and block height for testnet
        lodashSet(config, 'platform.dashpay', systemConfigs.testnet.platform.dashpay);
      });

    return configFile;
  },
  '0.18.0': (configFile) => {
    configFile.defaultGroupName = null;

    return configFile;
  },
};
