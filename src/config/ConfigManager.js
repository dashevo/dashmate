const path = require('path');
const fs = require('fs-extra');
const Config = require('./Config');

class ConfigManager {
  /**
   * @param {Config} config
   */
  constructor(config) {
    this.config = config;
    this.configDir = global.config.configDir;
  }

  /**
   * Load configs from file
   * @return {Promise<Config>}
   */
  async loadConfigs() {
    try {
      const configFile = path.join(this.configDir, ('config.json'));

      if (!await fs.pathExists(configFile)) {
        console.error('Configuration does not exist, please set the configuration first.')
        this.exit();
      }
      const configData = fs.readJSONSync(configFile);

      return configData;

    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Select config by name
   * @param {String}
   * @return {Promise<Config>}
   */
  async getConfig(name) {
    try {
      const configData = await this.loadConfigs();

      const selectedConfig = configData.configs.find(obj => {
        return obj.name === name;
      })

      return selectedConfig;
    } catch (e) {
      console.log(e);
    }
  }

  async getCurrentConfigName() {
    try {
      return this.config.getName();
    } catch (e) {
      console.log(e);
    }
  }

  async getAllConfigs() {
    try {
      const configData = await this.loadConfigs();

      let existingConfigs = [];

      configData.configs.forEach(e => existingConfigs.push(e.name));

      return existingConfigs;
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = ConfigManager;
