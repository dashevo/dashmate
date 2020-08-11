const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigSetCommand extends BaseCommand {
  /**
   * @param args
   * @param flags
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      config: configName,
      option: optionPath,
      value: optionValue,
    },
    flags,
    configCollection,
  ) {
    const config = configCollection.getConfig(configName);

    config.set(optionPath, optionValue);

    // eslint-disable-next-line no-console
    console.log(`${optionPath} set to ${config.get(optionPath)}`);
  }
}

ConfigSetCommand.description = `Set config option

Sets a configuration option to the specified config
`;

ConfigSetCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}, {
  name: 'option',
  required: true,
  description: 'option path',
}, {
  name: 'value',
  required: true,
  description: 'the option value',
}];

module.exports = ConfigSetCommand;
