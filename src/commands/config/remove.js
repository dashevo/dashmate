const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigManager');

class ConfigRemoveCommand extends BaseCommand {
  /**
   * @param {ConfigManager} config
   * @return {Promise<void>}
   */
  async runWithDependencies(config) {
    try {
      console.log('Entering remove command');

      async () => ConfigManager.loadConfigs();
      console.log(Config);
      this.exit();
    } catch (e) {
      console.log(e);
    }
  }
}

ConfigRemoveCommand.description = 'Removes a configuration';

module.exports = ConfigRemoveCommand;
