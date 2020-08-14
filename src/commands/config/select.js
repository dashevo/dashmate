const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigSelectCommand extends BaseCommand {
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
    configCollection.setDefaultConfigName(configName);

    // eslint-disable-next-line no-console
    console.log(`${configName} config selected as default`);
  }
}

ConfigSelectCommand.description = `Select config as default`;

ConfigSelectCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigSelectCommand;
