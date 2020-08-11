const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigEnvsCommand extends BaseCommand {
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
    const config = configCollection.getConfig(configName);

    for (const [key, value] of Object.entries(config.toEnvs())) {
      // eslint-disable-next-line no-console
      console.log(`${key}="${value}"`);
    }
  }
}

ConfigEnvsCommand.description = `Export config to envs

Export configuration options as Docker Compose envs
`;

ConfigEnvsCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigEnvsCommand;
