/**
 * @param {Object} defaultConfigs
 * @return {resetDefaultConfig}
 */
function resetDefaultConfigFactory(defaultConfigs) {
  /**
   * @typedef {resetDefaultConfig}
   *
   * @param {ConfigCollection} configCollection
   * @param {string} name
   */
  function resetDefaultConfig(configCollection, name) {
    const defaultConfigNames = Object.keys(defaultConfigs);
    if (!defaultConfigNames.contains(name)) {
      throw new Error(`Only default configs can be reset: ${defaultConfigNames.join(', ')}`);
    }

    configCollection.getConfig(name).setOptions(defaultConfigs[name]);
  }

  return resetDefaultConfig;
}

module.exports = resetDefaultConfigFactory;
