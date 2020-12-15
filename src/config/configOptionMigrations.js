const lodashSet = require('lodash.set');

// const systemConfigs = require('./systemConfigs/systemConfigs');

module.exports = {
  '0.17.0-dev.12': (name, options) => {
    lodashSet(options, 'platform.dapi.nginx.rateLimiter.enable', name !== 'base');
    lodashSet(options, 'platform.dapi.nginx.rateLimiter.rate', 120);
    lodashSet(options, 'platform.dapi.nginx.rateLimiter.burst', 300);

    lodashSet(options, 'platform.drive.tenderdash', options.platform.drive.tendermint);
    // eslint-disable-next-line no-param-reassign
    delete options.platform.drive.tendermint;

    lodashSet(options, 'platform.drive.tenderdash.validatorKey', {});
    lodashSet(options, 'platform.drive.tenderdash.nodeKey', {});

    return options;
  },
};
