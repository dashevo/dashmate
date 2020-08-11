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
    const defaultConfigName = await configCollection.getDefaultConfigName();

    const message = defaultConfigName === null
      ? 'Default config is not selected'
      : `${defaultConfigName} config is selected as default`;

    // eslint-disable-next-line no-console
    console.log(message);
  }
}

ConfigCommand.description = `Show default config

Shows current default configuration name
`;

module.exports = ConfigCommand;
