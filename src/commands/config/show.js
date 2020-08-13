const { inspect } = require('util');

const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigShowCommand extends BaseCommand {
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
    // eslint-disable-next-line no-console
    console.log(
      inspect(
        config.getOptions(),
        { colors: true, depth: null },
      ),
    );
  }
}

ConfigShowCommand.description = `Show config options

Display configuration options for the specified config
`;

ConfigShowCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = ConfigShowCommand;
