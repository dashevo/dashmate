const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const { PrivateKey } = require('@dashevo/dashcore-lib');

const ms = require('ms');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

const NETWORKS = require('../networks');

class StartCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {startNodeTask} startNodeTask
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      'full-node': isFullNode,
      update: isUpdate,
      'drive-image-build-path': driveImageBuildPath,
      'dapi-image-build-path': dapiImageBuildPath,
      'mine-blocks': mineBlocks,
    },
    dockerCompose,
    startNodeTask,
    config,
  ) {
    let blockTimeMs;

    if (mineBlocks !== null) {
      if (config.get('network') !== NETWORKS.LOCAL) {
        throw new Error(`mine-blocks option supposed to work only with local network. Your network is ${config.get('network')}`);
      }

      blockTimeMs = ms(mineBlocks);
      if (blockTimeMs === undefined || blockTimeMs < 0) {
        throw new Error(`Invalid mine-blocks value ${mineBlocks}`);
      }
    }

    const tasks = new Listr(
      [
        {
          title: `Start ${isFullNode ? 'full node' : 'masternode'}`,
          task: () => startNodeTask(
            config,
            {
              isFullNode,
              driveImageBuildPath,
              dapiImageBuildPath,
              isUpdate,
            },
          ),
        },
        {
          title: 'Start mining',
          enabled: () => mineBlocks !== null,
          task: async () => {
            const privateKey = new PrivateKey();
            const address = privateKey.toAddress('regtest').toString();

            await dockerCompose.execCommand(
              config.toEnvs(),
              'core',
              [
                'bash',
                '-c',
                `while true; do dash-cli generatetoaddress 1 ${address}; sleep ${blockTimeMs / 1000}; done`,
              ],
              ['--detach'],
            );
          },
        },
      ],
      {
        rendererOptions: {
          clearOutput: false,
          collapse: false,
          showSubtasks: true,
        },
      },
    );

    try {
      await tasks.run();
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

StartCommand.description = `Start masternode
...
Start masternode with specific preset
`;

StartCommand.flags = {
  ...BaseCommand.flags,
  'full-node': flagTypes.boolean({ char: 'f', description: 'start as full node', default: false }),
  update: flagTypes.boolean({ char: 'u', description: 'download updated services before start', default: false }),
  'drive-image-build-path': flagTypes.string({ description: 'drive\'s docker image build path', default: null }),
  'dapi-image-build-path': flagTypes.string({ description: 'dapi\'s docker image build path', default: null }),
  'mine-blocks': flagTypes.string({ description: 'new blocks mining interval for local node e.g. 5s', default: null }),
};

module.exports = StartCommand;
