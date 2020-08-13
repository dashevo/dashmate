const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigEnvsCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    config,
  ) {
    for (const [key, value] of Object.entries(config.toEnvs())) {
      // eslint-disable-next-line no-console
      console.log(`${key}="${value}"`);
    }
  }
}

ConfigEnvsCommand.description = `Export config to envs

Export configuration options as Docker Compose envs
`;

ConfigEnvsCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = ConfigEnvsCommand;
