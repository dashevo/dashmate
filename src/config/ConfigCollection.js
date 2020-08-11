const Config = require('./Config');
const protectedConfigs = require('./default/protectedConfigs');

const ConfigAlreadyPresentError = require('./errors/ConfigAlreadyPresentError');
const ConfigIsNotPresentError = require('./errors/ConfigIsNotPresentError');
const NoConfigSelectedError = require('./errors/NoConfigSelectedError');
const ConfigIsProtectedError = require('./errors/ConfigIsProtectedError');

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
   * @returns {string}
   */
  getCurrentConfigName() {
    if(this.currentConfigName === null) {
      throw new NoConfigSelectedError();
    } else {
      return this.currentConfigName;
    };

  }

  /**
   * Get current config if set
   *
   * @returns {Config|null}
   */
  getCurrentConfig() {
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
   * @param {string} [fromConfigName] - Set options from another config
   * @returns {ConfigCollection}
   */
  createConfig(name, fromConfigName = undefined) {
    if (this.isConfigExists(name)) {
      throw new ConfigAlreadyPresentError(name);
    }

    let options;
    if (fromConfigName) {
      const fromConfig = this.getConfig(fromConfigName);

      options = fromConfig.getOptions();
    }

    this.configsMap[name] = new Config(name, options);

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
    } else if (protectedConfigs.includes(name)) {
      throw new ConfigIsProtectedError(name);
    }

    if (this.getCurrentConfigName() === name) {
      this.setCurrentConfigName(null);
    }

    delete this.configsMap[name];

    return this;
  }
}

module.exports = ConfigCollection;
