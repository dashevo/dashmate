const fs = require('fs');
const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class ConfigEnvsCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      output: fileOutput,
    },
    config,
  ) {
    let envOutput = '';

    for (const [key, value] of Object.entries(config.toEnvs())) {
      envOutput = envOutput + (`${key}="${value}"`) + '\n';
    }

    const envFilePath = '.env.' + config.name;

    if (fileOutput === true) {
      try {
        fs.writeFileSync(envFilePath, envOutput, 'utf8');
      } catch (e) {
        throw new MuteOneLineError(e);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(envOutput);
    }
  }
}

ConfigEnvsCommand.description = `Export config to envs

Export configuration options as Docker Compose envs
`;

ConfigEnvsCommand.flags = {
  ...BaseCommand.flags,
  'output': flagTypes.boolean({ char: 'o', description: 'output to file', default: false }),
};

module.exports = ConfigEnvsCommand;
