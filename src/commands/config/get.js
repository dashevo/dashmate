const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigGetCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      config: configName,
      option: optionPath,
    },
    flags,
    configCollection,
  ) {
    const config = configCollection.getConfig(configName);

    // eslint-disable-next-line no-console
    console.log(config.get(optionPath));
  }
}

ConfigGetCommand.description = `Get config option

Gets a configuration option from the specified config
`;

ConfigGetCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}, {
  name: 'option',
  required: true,
  description: 'option path',
}];

module.exports = ConfigGetCommand;
