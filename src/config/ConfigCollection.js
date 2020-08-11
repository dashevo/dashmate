const Config = require('./Config');

const ConfigAlreadyPresentError = require('./errors/ConfigAlreadyPresentError');
const ConfigIsNotPresentError = require('./errors/ConfigIsNotPresentError');

class ConfigCollection {
  /**
   * @param {Config[]} [configs]
   * @param {string|null} [currentConfigName=null]
   */
  constructor(configs = [], currentConfigName = null) {
    this.configsMap = configs.reduce((configsMap, config) => {
      // eslint-disable-next-line no-param-reassign
      configsMap[config.getName()] = config;

      return configsMap;
    }, {});

    this.setCurrentConfigName(currentConfigName);
  }

  /**
   * Get call configs
   *
   * @returns {Config[]}
   */
  getAllConfigs() {
    return Object.values(this.configsMap);
  }

  /**
   * Set current config name
   *
   * @param {string|null} name
   * @returns {ConfigCollection}
   */
  setCurrentConfigName(name) {
    if (name !== null && !this.isConfigExists(name)) {
      throw new ConfigIsNotPresentError(name);
    }

    this.currentConfigName = name;

    return this;
  }

  /**
   * Get current config name if set
   *
   * @returns {string|null}
   */
  getCurrentConfigName() {
    return this.currentConfigName;
  }

  /**
   * Get current config if set
   *
   * @returns {Config|null}
   */
  getCurrentConfig() {
    if (this.getCurrentConfigName() === null) {
      return null;
    }

    return this.getConfig(
      this.getCurrentConfigName(),
    );
  }

  /**
   * Get config by name
   *
   * @param {string} name
   */
  getConfig(name) {
    if (!this.isConfigExists(name)) {
      throw new ConfigIsNotPresentError(name);
    }

    return this.configsMap[name];
  }

  /**
   * Is config exists
   *
   * @param {string} name
   * @returns {boolean}
   */
  isConfigExists(name) {
    return Object.prototype.hasOwnProperty.call(this.configsMap, name);
  }

  /**
   * Create a new config
   *
   * @param {string} name
   * @param {string} fromConfigName - Set options from another config
   * @returns {ConfigCollection}
   */
  createConfig(name, fromConfigName) {
    if (this.isConfigExists(name)) {
      throw new ConfigAlreadyPresentError(name);
    }

    const fromConfig = this.getConfig(fromConfigName);

    this.configsMap[name] = new Config(name, fromConfig.getOptions());

    return this.configsMap[name];
  }

  /**
   * Remove config by name
   *
   * @param {string} name
   * @returns {ConfigCollection}
   */
  removeConfig(name) {
    if (!this.isConfigExists(name)) {
      throw new ConfigIsNotPresentError(name);
    }

    if (this.getCurrentConfigName() === name) {
      this.setCurrentConfigName(null);
    }

    delete this.configsMap[name];

    return this;
  }
}

module.exports = ConfigCollection;
