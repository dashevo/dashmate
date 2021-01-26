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
   * @param {Docker} docker
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
    docker,
    tenderdashInitTask,
  ) {
    const tasks = new Listr([
      {
        title: 'Stop services',
        task: async () => dockerCompose.stop(config.toEnvs()),
      },
      {
        title: 'Reset platform data',
        enabled: () => isPlatformOnlyReset,
        task: () => (
          new Listr([
            {
              title: 'Remove platform services and associated data',
              task: async () => {
                const coreContainerNames = ['core', 'sentinel'];
                const containerNames = await dockerCompose
                  .getContainersList(config.toEnvs(), undefined, true);
                const platformContainerNames = containerNames
                  .filter((containerName) => !coreContainerNames.includes(containerName));

                await dockerCompose.rm(config.toEnvs(), platformContainerNames);
              },
            },
            {
              title: 'Clean up platform volumes',
              task: async () => docker.pruneVolumes(),
            },
            {
              title: 'Reset platform config',
              enabled: () => isHardReset,
              task: async () => resetSystemConfig(configCollection, config.getName(), true),
            },
          ])
        ),
      },
      {
        title: 'Reset node data',
        enabled: () => !isPlatformOnlyReset,
        task: () => (
          new Listr([
            {
              title: 'Remove all services and associated data',
              task: async () => dockerCompose.down(config.toEnvs()),
            },
            {
              title: 'Reset config',
              enabled: () => isHardReset,
              task: async () => resetSystemConfig(configCollection, config.getName()),
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
