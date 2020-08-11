const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigGetCommand extends BaseCommand {
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
    const option = currentConfig.get(args.option);
    if (option) {
      console.log(option)
    } else {
      console.log('option not found');
    }
  }
}

ConfigGetCommand.description = 'Gets a configuration option';

ConfigGetCommand.args = [{
  name: 'option',
  required: true,
  description: 'option to get',
}]

module.exports = ConfigGetCommand;
