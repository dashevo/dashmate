const Config = require('../Config');

const ConfigCollection = require('../ConfigCollection');

/**
 * @param {Object} defaultConfigs
 * @return {createDefaultConfigs}
 */
function createDefaultConfigsFactory(defaultConfigs) {
  /**
   * @typedef {createDefaultConfigs}
   * @returns {ConfigCollection}
   */
  function createDefaultConfigs() {
    const configs = Object.entries(defaultConfigs).map(([name, options]) => (
      new Config(name, options)
    ));

    return new ConfigCollection(configs);
  }

  return createDefaultConfigs;
}

module.exports = createDefaultConfigsFactory;
