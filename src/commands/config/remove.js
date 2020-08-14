const BaseCommand = require('../../oclif/command/BaseCommand');

const systemConfigs = require('../../config/systemConfigs/systemConfigs');

class ConfigRemoveCommand extends BaseCommand {
  static aliases = ['config:remove', 'config:rm']
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
    if (Object.keys(systemConfigs).includes(configName)) {
      throw new Error(`System config ${configName} can't be removed`);
    }

    configCollection.removeConfig(configName);

    // eslint-disable-next-line no-console
    console.log(`${configName} is removed`);
  }
}

ConfigRemoveCommand.description = `Remove config

Removes a configuration
`;

ConfigRemoveCommand.args = [{
  name: 'config',
  required: true,
  description: 'config name',
}];

module.exports = ConfigRemoveCommand;
