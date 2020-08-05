const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigListCommand extends BaseCommand {
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
      const configList = await configManager.getAllConfigs();

      configList.forEach(e => console.log(e));

      //console.log('trying new stuff');
      //const configObject = await configManager.getConfig('locals');

    } catch (e) {
      console.log(e);
    }
  }
}

ConfigListCommand.description = 'Lists available configurations';

module.exports = ConfigListCommand;
