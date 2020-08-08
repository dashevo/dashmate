const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    configCollection,
  ) {
    const currentConfigName = await configCollection.getCurrentConfigName();

    const currentConfig = await configCollection.getConfig(currentConfigName)

    console.log(require('util').inspect(currentConfig, {colors:true, depth:null}));
  }
}

ConfigCommand.description = 'Shows current configuration and options';

module.exports = ConfigCommand;
