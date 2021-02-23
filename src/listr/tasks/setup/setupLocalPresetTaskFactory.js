const { Listr } = require('listr2');
const { PRESET_LOCAL } = require('../../../constants');

const wait = require('../../../util/wait');

/**
 * @param {registerMasternodeTask} registerMasternodeTask
 * @param {generateToAddressTask} generateToAddressTask
 * @param {tenderdashInitTask} tenderdashInitTask
 * @param {initTask} initTask
 * @param {startNodeTask} startNodeTask
 * @param {ConfigFile} configFile
 * @param {writeServiceConfigs} writeServiceConfigs
 * @param {renderServiceTemplates} renderServiceTemplates
 * @param {DockerCompose} dockerCompose
 * @param {Dockerode} docker
 * @param {startCore} startCore
 * @param {waitForCoreSync} waitForCoreSync
 * @param {generateBlocks} generateBlocks
 * @param {resolveDockerHostIp} resolveDockerHostIp
 */
function setupLocalPresetTaskFactory(
  registerMasternodeTask,
  generateToAddressTask,
  tenderdashInitTask,
  initTask,
  startNodeTask,
  configFile,
  writeServiceConfigs,
  renderServiceTemplates,
  dockerCompose,
  docker,
  startCore,
  waitForCoreSync,
  generateBlocks,
  resolveDockerHostIp,
) {
  /**
   * @param {Config} config
   * @return {boolean}
   */
  function isSeedNode(config) {
    return config.getName() === 'local_seed';
  }

  /**
   * @typedef {setupLocalPresetTask}
   * @return {Listr}
   */
  function setupLocalPresetTask() {
    const amount = 1010;

    return new Listr([
      {
        title: 'Set the number of nodes',
        enabled: (ctx) => ctx.nodeCount === null,
        task: async (ctx, task) => {
          ctx.nodeCount = await task.prompt({
            type: 'Numeral',
            message: 'Enter the number of masternodes',
            initial: 3,
            float: false,
            min: 3,
            max: 6,
            validate: (state) => {
              if (+state < 3 || +state > 6) {
                return 'You must set from 3 up to 6 nodes';
              }

              return true;
            },
          });
        },
      },
      {
        title: 'Create local group configs',
        task: (ctx) => {
          ctx.configGroup = new Array(ctx.nodeCount)
            .fill(undefined)
            .map((value, i) => `local_${i + 1}`)
            // we need to add one more node (number of masternodes + 1) as a seed node
            .concat(['local_seed'])
            .map((configName) => (
              configFile.isConfigExists(configName)
                ? configFile.getConfig(configName)
                : configFile.createConfig(configName, PRESET_LOCAL)
            ));

          const subTasks = ctx.configGroup.map((config, i) => (
            {
              title: `Create ${config.getName()} config`,
              task: () => {
                const nodeIndex = i + 1;

                config.set('core.p2p.port', 20001 + (i * 100));
                config.set('core.rpc.port', 20002 + (i * 100));

                if (isSeedNode(config)) {
                  config.set('description', 'seed node for local network');

                  config.set('compose.file', 'docker-compose.yml');
                  config.set('core.masternode.enable', false);
                } else {
                  config.set('description', `local node #${nodeIndex}`);

                  config.set('platform.dapi.nginx.http.port', 3000 + (i * 100));
                  config.set('platform.dapi.nginx.grpc.port', 3010 + (i * 100));
                  config.set('platform.drive.tenderdash.p2p.port', 26656 + (i * 100));
                  config.set('platform.drive.tenderdash.rpc.port', 26657 + (i * 100));

                  config.set('platform.drive.abci.log.prettyFile.path', `/tmp/drive_pretty_${nodeIndex}.log`);
                  config.set('platform.drive.abci.log.jsonFile.path', `/tmp/drive_json_${nodeIndex}.log`);
                }
              },
            }
          ));

          configFile.setDefaultGroupName(PRESET_LOCAL);

          return new Listr(subTasks);
        },
      },
      {
        title: 'Configure Core nodes',
        task: async (ctx) => {
          ctx.hostDockerInternalIp = await resolveDockerHostIp();

          const p2pSeeds = ctx.configGroup.map((config) => ({
            host: ctx.hostDockerInternalIp,
            port: config.get('core.p2p.port'),
          }));

          ctx.configGroup.forEach((config, i) => {
            config.set(
              'core.p2p.seeds',
              p2pSeeds.filter((seed, index) => index !== i),
            );

            // Write configs
            const configFiles = renderServiceTemplates(config);
            writeServiceConfigs(config.getName(), configFiles);
          });

          return new Listr([
            {
              title: 'Starting Core nodes',
              task: async () => {
                const coreServices = [];

                let isGenesisBlockGenerated = false;

                for (const config of ctx.configGroup) {
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

                await wait(5000);
              },
            },
            {
              title: 'Register masternodes',
              task: () => {
                const masternodeConfigs = ctx.configGroup.slice(0, -1);

                const subTasks = masternodeConfigs.map((config, i) => ({
                  title: `Register ${config.getName()} masternode`,
                  skip: () => {
                    if (config.get('core.masternode.operator.privateKey')) {
                      return `Masternode operator private key ('core.masternode.operator.privateKey') is already set in ${config.getName()} config`;
                    }

                    return false;
                  },
                  task: () => new Listr([
                    // hidden task to set coreService
                    {
                      task: () => {
                        ctx.coreService = ctx.coreServices[i];
                      },
                    },
                    {
                      title: 'Await for Core to sync',
                      enabled: () => i > 0,
                      task: () => waitForCoreSync(ctx.coreService),
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

                        await wait(30000);
                      },
                    },
                  ]),
                }));

                // eslint-disable-next-line consistent-return
                return new Listr(subTasks);
              },
            },
            {
              title: 'Stopping nodes',
              task: async () => (Promise.all(
                ctx.coreServices.map((coreService) => coreService.stop()),
              )),
            },
          ]);
        },
      },
      {
        title: 'Configure Tenderdash nodes',
        task: (ctx) => {
          const masternodeConfigs = ctx.configGroup.slice(0, -1);

          const subTasks = masternodeConfigs.map((config) => ({
            title: `Initialize ${config.getName()} Tenderdash`,
            task: () => tenderdashInitTask(config),
          }));

          return new Listr(subTasks);
        },
      },
      {
        title: 'Interconnect Tenderdash nodes',
        task: (ctx) => {
          let genesisTime;
          const randomChainIdPart = Math.floor(Math.random() * 60) + 1;
          const chainId = `dash_masternode_local_${randomChainIdPart}`;

          const masternodeConfigs = ctx.configGroup.slice(0, -1);

          const validators = masternodeConfigs.map((config, index) => {
            const validatorKey = config.get('platform.drive.tenderdash.validatorKey');

            return {
              address: validatorKey.address,
              pub_key: validatorKey.pub_key,
              power: '1',
              name: `node${index}`,
            };
          });

          masternodeConfigs.forEach((config, index) => {
            if (index === 0) {
              genesisTime = config.get('platform.drive.tenderdash.genesis.genesis_time');
            }

            config.set('platform.drive.tenderdash.genesis.genesis_time', genesisTime);
            config.set('platform.drive.tenderdash.genesis.chain_id', chainId);

            const p2pPeers = masternodeConfigs.map((innerConfig, i) => {
              if (index === i) {
                return null;
              }

              const nodeId = innerConfig.get('platform.drive.tenderdash.nodeId');

              return {
                id: nodeId,
                host: ctx.hostDockerInternalIp,
                port: 26656 + (i * 100),
              };
            }).filter((p2pPeer) => p2pPeer !== null);

            console.dir(p2pPeers);

            throw new Error('zalupa');

            config.set('platform.drive.tenderdash.p2p.persistentPeers', p2pPeers);
            config.set('platform.drive.tenderdash.genesis.validators', validators);

            const configFiles = renderServiceTemplates(config);
            writeServiceConfigs(config.getName(), configFiles);
          });
        },
      },
      {
        title: 'Starting nodes',
        task: async (ctx) => {
          const masternodeConfigs = ctx.configGroup.slice(0, -1);

          const startNodeTasks = masternodeConfigs.map((config, i) => ({
            title: `Starting ${config.getName()} node #${i + 1}`,
            task: () => startNodeTask(
              config,
              {
                driveImageBuildPath: ctx.driveImageBuildPath,
                dapiImageBuildPath: ctx.dapiImageBuildPath,
                // run miner only at controlling node
                isMinerEnabled: i === ctx.nodeCount,
              },
            ),
          }));

          return new Listr(startNodeTasks);
        },
      },
      {
        title: 'Wait 20 seconds to ensure all services are running',
        task: async () => wait(20000),
      },
      {
        title: 'Initialize Platform',
        task: (ctx) => {
          const masternodeConfigs = ctx.configGroup.slice(0, -1);
          const [lastMasternodeConfig] = masternodeConfigs.slice(-1);
          return initTask(lastMasternodeConfig);
        },
      },
      {
        title: 'Stopping nodes',
        task: async (ctx) => {
          const stopNodeTasks = ctx.configGroup.map((config, i) => ({
            title: `Stop ${config.getName()} node #${i + 1}`,
            task: async () => dockerCompose.stop(config.toEnvs()),
          }));

          return new Listr(stopNodeTasks);
        },
      },
    ]);
  }

  return setupLocalPresetTask;
}

module.exports = setupLocalPresetTaskFactory;
