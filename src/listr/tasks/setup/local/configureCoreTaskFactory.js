const { Listr } = require('listr2');
const { Observable } = require('rxjs');

const {
  PrivateKey,
} = require('@dashevo/dashcore-lib');

const waitForNodesToHaveTheSameSporks = require('../../../../core/waitForNodesToHaveTheSameSporks');

const { NETWORK_LOCAL } = require('../../../../constants');

/**
 * @param {resolveDockerHostIp} resolveDockerHostIp
 * @param {renderServiceTemplates} renderServiceTemplates
 * @param {writeServiceConfigs} writeServiceConfigs
 * @param {startCore} startCore
 * @param {generateBlocks} generateBlocks
 * @param {waitForCoreSync} waitForCoreSync
 * @param {activateCoreSpork} activateCoreSpork
 * @param {generateToAddressTask} generateToAddressTask
 * @param {registerMasternodeTask} registerMasternodeTask
 * @param {generateBlsKeys} generateBlsKeys
 * @return {configureCoreTask}
 */
function configureCoreTaskFactory(
  resolveDockerHostIp,
  renderServiceTemplates,
  writeServiceConfigs,
  startCore,
  generateBlocks,
  waitForCoreSync,
  activateCoreSpork,
  generateToAddressTask,
  registerMasternodeTask,
  generateBlsKeys,
) {
  /**
   * @typedef {configureCoreTask}
   * @param {Config[]} configGroup
   * @return {Listr}
   */
  function configureCoreTask(configGroup) {
    const amount = 1100;

    return new Listr([
      {
        task: async (ctx) => {
          if (!ctx.hostDockerInternalIp) {
            ctx.hostDockerInternalIp = await resolveDockerHostIp();
          }

          const network = configGroup[0].get('network');
          const sporkPrivKey = new PrivateKey(undefined, network);
          const sporkAddress = sporkPrivKey.toAddress(network).toString();

          const p2pSeeds = configGroup.map((config) => ({
            host: ctx.hostDockerInternalIp,
            port: config.get('core.p2p.port'),
          }));

          configGroup.forEach((config, i) => {
            // Set seeds
            config.set(
              'core.p2p.seeds',
              p2pSeeds.filter((seed, index) => index !== i),
            );

            // Set sporks key
            config.set(
              'core.spork.address',
              sporkAddress,
            );

            config.set(
              'core.spork.privateKey',
              sporkPrivKey.toWIF(),
            );

            // Write configs
            const configFiles = renderServiceTemplates(config);
            writeServiceConfigs(config.getName(), configFiles);
          });

          return new Listr([
            {
              title: 'Starting wallets',
              task: async () => {
                const coreServices = [];

                let isGenesisBlockGenerated = false;

                for (const config of configGroup) {
                  const coreService = await startCore(config, { wallet: true, addressIndex: true });
                  coreServices.push(coreService);

                  // need to generate 1 block to connect nodes to each other
                  if (!isGenesisBlockGenerated) {
                    await generateBlocks(
                      coreService,
                      1,
                      config.get('network'),
                    );

                    isGenesisBlockGenerated = true;
                  }
                }

                ctx.coreServices = coreServices;
              },
            },
            {
              title: 'Activating DIP8 to enable DML',
              task: () => new Observable(async (observer) => {
                let isDip8Activated = false;
                let blockchainInfo;

                let blocksGenerated = 0;

                const blocksToGenerateInOneStep = 10;

                do {
                  ({
                    result: blockchainInfo,
                  } = await ctx.coreServices[0].getRpcClient().getBlockchainInfo());

                  isDip8Activated = blockchainInfo.bip9_softforks.dip0008.status === 'active';

                  if (isDip8Activated) {
                    break;
                  }

                  await generateBlocks(
                    ctx.coreServices[0],
                    blocksToGenerateInOneStep,
                    NETWORK_LOCAL,
                    // eslint-disable-next-line no-loop-func
                    (blocks) => {
                      blocksGenerated += blocks;

                      observer.next(`${blocksGenerated} blocks generated`);
                    },
                  );
                } while (!isDip8Activated);

                observer.next(`DIP8 has been activated at height ${blockchainInfo.bip9_softforks.dip0008.since}`);

                observer.complete();

                return this;
              }),
            },
            {
              title: 'Register masternodes',
              task: () => {
                const masternodeConfigs = configGroup.filter((config) => config.get('core.masternode.enable'));

                const subTasks = masternodeConfigs.map((config, i) => ({
                  title: `Register ${config.getName()} masternode`,
                  skip: () => {
                    if (config.get('core.masternode.operator.privateKey')) {
                      return `Masternode operator private key ('core.masternode.operator.privateKey') is already set in ${config.getName()} config`;
                    }

                    return false;
                  },
                  task: () => new Listr([
                    {
                      task: () => {
                        ctx.coreService = ctx.coreServices[i];
                      },
                    },
                    {
                      title: 'Generate a masternode operator key',
                      task: async (task) => {
                        ctx.operator = await generateBlsKeys();

                        config.set('core.masternode.operator.privateKey', ctx.operator.privateKey);

                        // eslint-disable-next-line no-param-reassign
                        task.output = `Public key: ${ctx.operator.publicKey}\nPrivate key: ${ctx.operator.privateKey}`;
                      },
                      options: { persistentOutput: true },
                    },
                    {
                      title: 'Await for Core to sync',
                      enabled: () => i > 0,
                      task: () => waitForCoreSync(ctx.coreService.getRpcClient()),
                    },
                    {
                      title: `Generate ${amount} dash to local wallet`,
                      task: () => generateToAddressTask(config, amount),
                    },
                    {
                      task: () => registerMasternodeTask(config),
                    },
                    {
                      // hidden task to clear values
                      task: async () => {
                        ctx.address = null;
                        ctx.privateKey = null;
                        ctx.coreService = null;
                      },
                    },
                  ]),
                }));

                // eslint-disable-next-line consistent-return
                return new Listr(subTasks);
              },
            },
            {
              title: 'Enable sporks',
              task: async () => {
                const sporks = [
                  'SPORK_2_INSTANTSEND_ENABLED',
                  'SPORK_3_INSTANTSEND_BLOCK_FILTERING',
                  'SPORK_9_SUPERBLOCKS_ENABLED',
                  'SPORK_17_QUORUM_DKG_ENABLED',
                  'SPORK_19_CHAINLOCKS_ENABLED',
                ];

                await Promise.all(
                  sporks.map(async (spork) => (
                    activateCoreSpork(ctx.coreServices[0].getRpcClient(), spork))),
                );

                await waitForNodesToHaveTheSameSporks(ctx.coreServices);
              },
            },
            {
              // Getting last height to use it as a initial core chain locked height for platform
              task: async () => {
                const rpcClient = ctx.coreServices[0].getRpcClient();
                const { result: initialCoreChainLockedHeight } = await rpcClient.getBlockCount();

                ctx.initialCoreChainLockedHeight = initialCoreChainLockedHeight;
              },
            },
            {
              title: 'Stopping wallets',
              task: async () => (Promise.all(
                ctx.coreServices.map((coreService) => coreService.stop()),
              )),
            },
          ]);
        },
      },
    ]);
  }

  return configureCoreTask;
}

module.exports = configureCoreTaskFactory;
