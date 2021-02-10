const baseConfig = require('./system/base');
const localConfig = require('./system/local');
const evonetConfig = require('./system/evonet');
const testnetConfig = require('./system/testnet');

module.exports = {
  base: baseConfig,
  local: localConfig,
  evonet: evonetConfig,
  testnet: testnetConfig,
};
