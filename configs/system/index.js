const baseConfig = require('./base');
const localConfig = require('./local');
const testnetConfig = require('./testnet');
const devnetConfig = require('./devnet');

module.exports = {
  base: baseConfig,
  local: localConfig,
  testnet: testnetConfig,
  devnet: devnetConfig,
};
