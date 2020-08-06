const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigCollection');

class ConfigGetCommand extends BaseCommand {
  /**
   * @param {ConfigManager} config
   * @return {Promise<void>}
   */
  async runWithDependencies(config) {
    try {
      console.log('Entering get command');

      async () => ConfigManager.loadConfigs();
      console.log(Config);
      this.exit();
    } catch (e) {
      console.log(e);
    }
  }
}

ConfigGetCommand.description = 'Gets a configuration option';

module.exports = ConfigGetCommand;
