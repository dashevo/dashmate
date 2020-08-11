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
    configCollection.setCurrentConfigName(configName);

    // eslint-disable-next-line no-console
    console.log(`${configName} config selected as a default`);
  }
}

ConfigSelectCommand.description = `Set config as default

Selects a configuration as a default one
`;

ConfigSelectCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigSelectCommand;
