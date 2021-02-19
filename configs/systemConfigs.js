const baseConfig = require('./system/base');
const localConfig = require('./system/local');
const testnetConfig = require('./system/testnet');

module.exports = {
  base: baseConfig,
  local: localConfig,
  testnet: testnetConfig,
};
