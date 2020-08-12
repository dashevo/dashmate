const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigResetCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {resetSystemConfig} resetSystemConfig
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      config: configName,
    },
    flags,
    resetSystemConfig,
    configCollection,
  ) {
    resetSystemConfig(configCollection, configName);

    // eslint-disable-next-line no-console
    console.log(`${configName} is reset to factory settings`);
  }
}

ConfigResetCommand.description = `Reset config

Reset system configuration to factory settings
`;

ConfigResetCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigResetCommand;
