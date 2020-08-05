const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigManager');

class ConfigSelectCommand extends BaseCommand {
  /**
   * @param {ConfigManager} config
   * @return {Promise<void>}
   */
  async runWithDependencies(config) {
    try {
      console.log('Entering select command');

      async () => ConfigManager.loadConfigs();
      console.log(Config);
      this.exit();
    } catch (e) {
      console.log(e);
    }
  }
}

ConfigSelectCommand.description = 'Selects a configuration';

module.exports = ConfigSelectCommand;
