const BaseCommand = require('../../oclif/command/BaseCommand');
const ConfigManager = require('../../config/ConfigManager');

class ConfigCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {ConfigManager} configManager
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
    },
    flags, 
    configManager,
  ) {
    try {
      const currentConfigName = await configManager.getCurrentConfigName();
      console.log('current config: ', currentConfigName);
      
      console.log(await configManager.getConfig(currentConfigName));

    } catch (e) {
      console.log(e);
    }
  }
}

ConfigCommand.description = 'Shows current configuration and options';

module.exports = ConfigCommand;
