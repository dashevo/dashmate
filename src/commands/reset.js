const { flags: flagTypes } = require('@oclif/command');

const { Listr } = require('listr2');

const rimraf = require('rimraf');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

const NETWORKS = require('../networks');

class ResetCommand extends BaseCommand {
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
        title: 'Reset node data',
        task: () => (
          new Listr([
            {
              title: 'Remove Tendermint data',
              enabled: () => config.get('network') !== NETWORKS.TESTNET,
              task: async () => {
                if (await dockerCompose.isServiceRunning(config.toEnvs())) {
                  throw new Error('You can\'t reset data while MN is running. Please stop it.');
                }

                await dockerCompose.runService(
                  config.toEnvs(),
                  'drive_tendermint',
                  ['tendermint', 'unsafe_reset_all'],
                  ['--entrypoint=""'],
                );
              },
            },
            {
              title: 'Remove Core data',
              task: () => rimraf.sync(`${__dirname}/../../data/${config.get('network')}/core/!(.gitignore)`),
            },
            {
              title: 'Remove Drive data',
              enabled: () => config.get('network') !== NETWORKS.TESTNET,
              task: async () => dockerCompose.down(config.toEnvs()),
            },
          ])
        ),
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

ResetCommand.description = `Reset node data

Reset node data
`;

ResetCommand.flags = {
  config: flagTypes.string({
    description: 'configuration name to use',
    default: null,
  }),
};

module.exports = ResetCommand;
