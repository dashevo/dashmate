const { inspect } = require('util');

const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigCommand extends BaseCommand {
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
    const output = `${config.getName()} config:\n\n${inspect(
      config.getOptions(),
      { colors: true, depth: null },
    )}`;

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

ConfigCommand.description = `Show config options

Display configuration options for the default config
`;

ConfigCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = ConfigCommand;
