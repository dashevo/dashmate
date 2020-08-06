const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigCollection');

class ConfigCreateCommand extends BaseCommand {
  /**
   * @param {ConfigManager} config
   * @return {Promise<void>}
   */
  async runWithDependencies(config) {
    try {
      console.log('Entering create command');

      async () => ConfigManager.loadConfigs();
      console.log(Config);
      this.exit();
    } catch (e) {
      console.log(e);
    }
  }
}

ConfigCreateCommand.description = 'Creates a new configuration';

module.exports = ConfigCreateCommand;
