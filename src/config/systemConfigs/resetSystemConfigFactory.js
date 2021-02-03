/**
 * @param {Object} systemConfigs
 * @return {resetSystemConfig}
 */
function resetSystemConfigFactory(systemConfigs) {
  /**
   * @typedef {resetSystemConfig}
   * @param {ConfigFile} configFile
   * @param {string} name
   * @param {boolean} platformOnly
   */
  function resetSystemConfig(configFile, name, platformOnly = false) {
    if (platformOnly) {
      const { platform: systemPlatformConfig } = systemConfigs[name];
      configFile.getConfig(name).set('platform', systemPlatformConfig);
    } else {
      configFile.getConfig(name).setOptions(systemConfigs[name]);
    }
  }

  return resetSystemConfig;
}

module.exports = resetSystemConfigFactory;
