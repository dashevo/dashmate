/* eslint-disable no-param-reassign */
const lodashSet = require('lodash.set');
const lodashGet = require('lodash.get');

const systemConfigs = require('./systemConfigs');
const NETWORKS = require('../src/networks');

module.exports = {
  '0.17.2': (configFile) => {
    Object.entries(configFile.configs).filter(([, config]) => config.network === NETWORKS.TESTNET)
      .forEach((config) => {
        // Set DashPay contract ID and block height for testnet
        // Set seed nodes for testnet tenderdash
        lodashSet(config, 'platform.drive.tenderdash.p2p.seeds', systemConfigs.testnet.platform.drive.tenderdash.p2p.seeds);
        lodashSet(config, 'platform.drive.tenderdash.p2p.persistentPeers', []);
      });

    return configFile;
  },
  '0.17.3': (configFile) => {
    Object.entries(configFile.configs).filter(([, config]) => config.network === NETWORKS.TESTNET)
      .forEach((config) => {
        // Set DashPay contract ID and block height for testnet
        lodashSet(config, 'platform.dashpay', systemConfigs.testnet.platform.dashpay);
      });

    return configFile;
  },
  '0.17.4': (configFile) => {
    Object.entries(configFile.configs).forEach(([name, config]) => {
      let baseConfig = systemConfigs.base;
      if (systemConfigs[name]) {
        baseConfig = systemConfigs[name];
      }

      const previousStdoutLogLevel = lodashGet(
        config,
        'platform.drive.abci.log.level',
      );

      // Set Drive's new logging variables
      lodashSet(config, 'platform.drive.abci.log', baseConfig.platform.drive.abci.log);

      // Keep previous log level for stdout
      if (previousStdoutLogLevel) {
        lodashSet(config, 'platform.drive.abci.log.stdout.level', previousStdoutLogLevel);
      }
    });
  },
  '0.19.0-dev': (configFile) => {
    // Add default group name if not present
    if (typeof configFile.defaultGroupName === 'undefined') {
      configFile.defaultGroupName = null;
    }

    // Add groups to existing configs
    Object.entries(configFile.configs)
      .forEach(([, config]) => {
        if (typeof config.group === 'undefined') {
          config.group = null;
        }
      });

    // Add local1 config if not present
    if (typeof configFile.configs.local1 === 'undefined') {
      configFile.configs.local1 = systemConfigs.local1;
    }

    // Add local2 config if not present
    if (typeof configFile.configs.local2 === 'undefined') {
      configFile.configs.local2 = systemConfigs.local2;
    }

    return configFile;
  },
};
