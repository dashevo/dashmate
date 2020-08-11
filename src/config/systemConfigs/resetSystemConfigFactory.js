/**
 * @param {Object} systemConfigs
 * @return {resetDefaultConfig}
 */
function resetSystemConfigFactory(systemConfigs) {
  /**
   * @typedef {resetDefaultConfig}
   *
   * @param {ConfigCollection} configCollection
   * @param {string} name
   */
  function resetDefaultConfig(configCollection, name) {
    const systemConfigNames = Object.keys(systemConfigs);
    if (!systemConfigNames.contains(name)) {
      throw new Error(`Only system configs can be reset: ${systemConfigNames.join(', ')}`);
    }

    configCollection.getConfig(name).setOptions(systemConfigs[name]);
  }

  return resetDefaultConfig;
}

module.exports = resetSystemConfigFactory;
