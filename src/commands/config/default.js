const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigDefaultCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      config: configName,
    },
    flags,
    configCollection,
  ) {
    if (configName === null) {
      // eslint-disable-next-line no-console
      console.log(configCollection.getDefaultConfigName());
    } else {
      configCollection.setDefaultConfigName(configName);

      // eslint-disable-next-line no-console
      console.log(`${configName} config will be used as default`);
    }
  }
}

ConfigDefaultCommand.description = `Default config

Displays default config name. Sets config as default if CONFIG argument is specified
`;

ConfigDefaultCommand.args = [{
  name: 'config',
  required: false,
  description: 'config name',
  default: null,
}];

module.exports = ConfigDefaultCommand;
