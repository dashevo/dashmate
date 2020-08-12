const { flags: flagTypes } = require('@oclif/command');

const { Listr } = require('listr2');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

class StopCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      config: configName,
    },
    dockerCompose,
    configCollection,
  ) {
    const config = configName === null
      ? configCollection.getDefaultConfig()
      : configCollection.getConfig(configName);

    const tasks = new Listr([
      {
        title: 'Stop node',
        task: async () => dockerCompose.stop(config.toEnvs()),
      },
    ],
    {
      rendererOptions: {
        clearOutput: false,
        collapse: false,
        showSubtasks: true,
      },
    });

    try {
      await tasks.run();
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

StopCommand.description = `Stop node

Stop node
`;

StopCommand.flags = {
  config: flagTypes.string({
    description: 'configuration name to use',
    default: null,
  }),
};

module.exports = StopCommand;
