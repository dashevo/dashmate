const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigSelectCommand extends BaseCommand {
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
    configCollection.setCurrentConfigName(args.config);
  }
}

ConfigSelectCommand.description = 'Selects a configuration';

ConfigSelectCommand.args = [{
  name: 'config',
  required: true,
  description: 'config to select',
}]

module.exports = ConfigSelectCommand;
