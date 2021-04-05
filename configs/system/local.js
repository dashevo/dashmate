const lodashMerge = require('lodash.merge');

const {
  NETWORK_LOCAL,
} = require('../../src/constants');

const baseConfig = require('./base');

module.exports = lodashMerge({}, baseConfig, {
  description: 'template for local configs',
  platform: {
    dapi: {
      nginx: {
        rateLimiter: {
          enable: false,
        },
      },
    },
    drive: {
      tenderdash: {
        consensus: {
          createEmptyBlocks: true,
          createEmptyBlocksInterval: '10s',
        },
      },
    },
  },
  environment: 'development',
  network: NETWORK_LOCAL,
});
