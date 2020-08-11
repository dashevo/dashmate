const { inspect } = require('util');

const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigShowCommand extends BaseCommand {
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

ConfigShowCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigShowCommand;
