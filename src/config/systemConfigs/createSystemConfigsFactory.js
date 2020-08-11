const Config = require('../Config');

const ConfigCollection = require('../ConfigCollection');

/**
 * @param {Object} systemConfigs
 * @return {createDefaultConfigs}
 */
function createSystemConfigsFactory(systemConfigs) {
  /**
   * @typedef {createDefaultConfigs}
   * @returns {ConfigCollection}
   */
  function createDefaultConfigs() {
    const configs = Object.entries(systemConfigs).map(([name, options]) => (
      new Config(name, options)
    ));

    return new ConfigCollection(configs, 'default');
  }

  return createDefaultConfigs;
}

module.exports = createSystemConfigsFactory;
