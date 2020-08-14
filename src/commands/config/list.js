const { table } = require('table');

const BaseCommand = require('../../oclif/command/BaseCommand');

class ConfigListCommand extends BaseCommand {
  static aliases = ['config:list', 'config:ls']
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
    const rows = configCollection.getAllConfigs()
      .map((config) => [config.getName(), config.get('description')]);

    const output = table(rows);

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

ConfigListCommand.description = 'Lists available configurations';

module.exports = ConfigListCommand;
