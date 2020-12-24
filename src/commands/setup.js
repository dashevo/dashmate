const { Listr } = require('listr2');
const publicIp = require('public-ip');
const NETWORKS = require('../networks');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

class SetupCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {generateBlsKeys} generateBlsKeys
   * @param {ConfigCollection} configCollection
   * @param {initializeTenderdashNode} initializeTenderdashNode
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    dockerCompose,
    generateBlsKeys,
    configCollection,
    initializeTenderdashNode,
    config,
  ) {
    const tasks = new Listr([
      {
        title: 'Select network',
        task: async (ctx, task) => {
          const input = await task.prompt([
            {
              type: 'select',
              name: 'network',
              message: 'Select network to configure',
              choices: [...Object.values(NETWORKS)],
              initial: 'testnet',
            },
          ]);
          ctx.network = input;
          configCollection.setDefaultConfigName(ctx.network);
          // eslint-disable-next-line no-param-reassign
          task.output = `Selected ${configCollection.getDefaultConfigName()} config\n`;
          // eslint-disable-next-line no-param-reassign
          config = configCollection.getDefaultConfig();
          // eslint-disable-next-line no-param-reassign
          task.output += `Loaded ${config.getName()} config`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Collect data',
        task: async (ctx) => {
          ctx.isGenesisEmpty = Object.keys(config.get('platform.drive.tenderdash.genesis')).length === 0;
        },
      },
      {
        title: 'Configure external IP address',
        task: async (ctx, task) => {
          const input = await task.prompt([
            {
              type: 'input',
              name: 'externalIp',
              message: 'Enter node public IP (Enter to accept detected IP)',
              initial: async () => ((config.externalIp) ? config.externalIp : publicIp.v4()),
            },
          ]);
          ctx.externalIp = input;
        },
      },
      {
        title: 'Configure BLS private key',
        task: async (ctx, task) => {
          const generatedBls = await generateBlsKeys();
          const input = await task.prompt([
            {
              type: 'input',
              name: 'blsPrivKey',
              message: 'Enter operator BLS private key (Enter to accept generated key)',
              initial: generatedBls.privateKey,
            },
          ]);
          if (input === generatedBls.privateKey) {
            // eslint-disable-next-line no-param-reassign
            task.output = `BLS public key: ${generatedBls.publicKey}\nBLS private key: ${generatedBls.privateKey}`;
          }
          ctx.blsPrivKey = input;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Initialize Tenderdash',
        task: async (ctx) => {
          const [validatorKey, nodeKey, genesis] = await initializeTenderdashNode(config);
          ctx.validatorKey = validatorKey;
          ctx.nodeKey = nodeKey;
          // Don't overwrite existing genesis in config
          ctx.genesis = ctx.isGenesisEmpty ? genesis : config.get('platform.drive.tenderdash.genesis');
        },
      },
      {
        title: 'Update config',
        task: (ctx) => {
          // eslint-disable-next-line no-param-reassign
          config.set('externalIp', ctx.externalIp);
          config.set('core.masternode.operator.privateKey', ctx.blsPrivKey);
          config.set('platform.drive.tenderdash.validatorKey', ctx.validatorKey);
          config.set('platform.drive.tenderdash.nodeKey', ctx.nodeKey);
        },
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

SetupCommand.description = `Set up node config

Set up node config
`;

SetupCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = SetupCommand;
