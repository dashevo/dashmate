const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

class ResetCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {resetSystemConfig} resetSystemConfig
   * @param {Config} config
   * @param {ConfigCollection} configCollection
   * @param {DockerCompose} dockerCompose
   * @param {tenderdashInitTask} tenderdashInitTask
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      verbose: isVerbose,
      hard: isHardReset,
      'platform-only': isPlatformOnlyReset,
    },
    resetSystemConfig,
    config,
    configCollection,
    dockerCompose,
    tenderdashInitTask,
  ) {
    const tasks = new Listr([
      {
        title: 'Stop services',
        task: async () => dockerCompose.stop(config.toEnvs()),
      },
      {
        title: 'Reset node data',
        task: () => (
          new Listr([
            {
              title: 'Remove platform services and associated data',
              enabled: () => isPlatformOnlyReset,
              task: async () => dockerCompose.rmPlatformOnly(config.toEnvs()),
            },
            {
              title: 'Remove all services and associated data',
              enabled: () => !isPlatformOnlyReset,
              task: async () => dockerCompose.down(config.toEnvs()),
            },
            {
              title: 'Reset config',
              enabled: () => isHardReset,
              task: async (task) => {
                resetSystemConfig(configCollection, config.getName());
                // eslint-disable-next-line no-param-reassign
                task.output = `${config.getName()} is reset to factory settings`;
              },
              options: { persistentOutput: true },
            },
          ])
        ),
      },
      {
        title: 'Initialize Tenderdash',
        enabled: () => !isHardReset,
        task: () => tenderdashInitTask(config),
      },
    ],
    {
      renderer: isVerbose ? 'verbose' : 'default',
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

ResetCommand.description = `Reset node data

Reset node data
`;

ResetCommand.flags = {
  ...BaseCommand.flags,
  hard: flagTypes.boolean({ char: 'h', description: 'reset config as well as data', default: false }),
  'platform-only': flagTypes.boolean({ char: 'p', description: 'reset platform data only', default: false }),
};

module.exports = ResetCommand;
