const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigCollection');

class ConfigSetCommand extends BaseCommand {
  /**
   * @param {ConfigManager} config
   * @return {Promise<void>}
   */
  async runWithDependencies(config) {
    try {
      console.log('Entering set command');

      async () => ConfigManager.loadConfigs();
      console.log(Config);
      this.exit();
    } catch (e) {
      console.log(e);
    }
  }
}

ConfigSetCommand.description = 'Sets a configuration option';

module.exports = ConfigSetCommand;
