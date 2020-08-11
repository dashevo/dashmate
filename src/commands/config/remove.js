const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigRemoveCommand extends BaseCommand {
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
    configCollection.removeConfig(args.config);
  }
}

ConfigRemoveCommand.description = 'Removes a configuration';

ConfigRemoveCommand.args = [{
  name: 'config',
  required: true,
  description: 'config to remove',
}]

module.exports = ConfigRemoveCommand;
