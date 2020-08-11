const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigSetCommand extends BaseCommand {
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
    const currentConfig = configCollection.getCurrentConfig();
    currentConfig.set(args.option, args.value);
  }
}

ConfigSetCommand.description = 'Sets a configuration option';

ConfigSetCommand.args = [{
  name: 'option',
  required: true,
  description: 'option to set',
}, {
  name: 'value',
  required: true,
  description: 'value for option'
}]



module.exports = ConfigSetCommand;
