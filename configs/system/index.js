const baseConfig = require('./base');
const localConfig = require('./local');
const testnetConfig = require('./testnet');
const schnappsConfig = require('./schnapps');

module.exports = {
  base: baseConfig,
  local: localConfig,
  testnet: testnetConfig,
  schnapps: schnappsConfig,
};
