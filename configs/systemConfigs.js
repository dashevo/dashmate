const baseConfig = require('./system/base');
const localConfig = require('./system/local');
const devnetConfig = require('./system/devnet');
const testnetConfig = require('./system/testnet');

module.exports = {
  base: baseConfig,
  local: localConfig,
  devnet: devnetConfig,
  testnet: testnetConfig,
};
