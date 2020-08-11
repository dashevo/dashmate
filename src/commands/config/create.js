const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigCreateCommand extends BaseCommand {
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
    if (args.from) {
      configCollection.createConfig(args.config, args.from);
    } else {
      configCollection.createConfig(args.config);
    }
  }
}

ConfigCreateCommand.description = 'Creates a new configuration';

ConfigCreateCommand.args = [{
  name: 'config',
  required: true,
  description: 'name of config to create',
}, {
  name: 'from',
  required: false,
  description: 'base new config on existing config'
}]

module.exports = ConfigCreateCommand;
