const os = require('os');
const { Listr } = require('listr2');
const { WritableStream } = require('memory-streams');
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
) {
  /**
   * @typedef {setupLocalPresetTask}
   * @return {Listr}
   */
  function setupLocalPresetTask() {
    const amount = 10000;

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
        // hidden task to dynamically get
        // host.docker.internal ip address
        task: async (ctx) => {
          // pulling image before run
          // or we can get 404 error (on first run)
          await new Promise((resolve, reject) => {
            docker.pull('alpine', (err, stream) => {
              if (err) {
                reject(new Error(`Can't pull alpine image: ${err.message}`));

                return;
              }

              const onProgress = () => {};

              const onFinished = (error) => {
                if (!error) {
                  resolve();
                } else {
                  reject(new Error(`Can't pull alpine image: ${error.message}`));
                }
              };

              docker.modem.followProgress(stream, onFinished, onProgress);
            });
          });

          const platform = os.platform();

          const hostConfig = {
            AutoRemove: true,
          };

          if (platform !== 'darwin' && platform !== 'win32') {
            hostConfig.ExtraHosts = ['host.docker.internal:host-gateway'];
          }

          const writableStream = new WritableStream();

          const [result] = await docker.run(
            'alpine',
            [],
            writableStream,
            {
              Entrypoint: ['sh', '-c', 'ping -c1 host.docker.internal | sed -nE \'s/^PING[^(]+\\(([^)]+)\\).*/\\1/p\''],
              HostConfig: hostConfig,
            },
          );

          const output = writableStream.toString();

          if (result.StatusCode !== 0) {
            throw new Error(`Can't get host.docker.internal IP address: ${output}`);
          }

          ctx.hostDockerInternalIp = output.trim();
        },
      },
      {
        // hidden task to dynamically create
        // multinode tasks listr
        // we need to add one more node (number of masternodes + 1) which controls masternodes
        task: (ctx) => {
          const subTasks = [];

          for (let i = 0; i <= ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            subTasks.push({
              title: `Setup node #${i + 1}`,
              task: () => new Listr([
                {
                  title: 'Create config',
                  task: () => {
                    const configName = `${ctx.preset}_${i + 1}`;

                    if (configFile.isConfigExists(configName)) {
                      ctx[configReference] = configFile.getConfig(configName);
                    } else {
                      configFile.setDefaultGroupName(PRESET_LOCAL);
                      ctx[configReference] = configFile.createConfig(configName, PRESET_LOCAL);
                    }

                    const config = ctx[configReference];

                    config.set('description', `config for local node #${i + 1}`);
                    config.set('core.p2p.port', 20001 + (i * 100));
                    config.set('core.rpc.port', 20002 + (i * 100));

                    const p2pSeeds = [];
                    for (let n = 0; n <= ctx.nodeCount; n++) {
                      if (n === i) {
                        continue;
                      }

                      p2pSeeds.push({
                        host: ctx.hostDockerInternalIp,
                        port: 20001 + (n * 100),
                      });
                    }

                    config.set('core.p2p.seeds', p2pSeeds);

                    config.set('platform.dapi.nginx.http.port', 3000 + (i * 100));
                    config.set('platform.dapi.nginx.grpc.port', 3010 + (i * 100));
                    config.set('platform.drive.tenderdash.p2p.port', 26656 + (i * 100));
                    config.set('platform.drive.tenderdash.rpc.port', 26657 + (i * 100));
                    config.set('platform.drive.abci.log.prettyFile.path', `/tmp/drive_pretty_${i}.log`);
                    config.set('platform.drive.abci.log.jsonFile.path', `/tmp/drive_json_${i}.log`);

                    // setup controlling node
                    if (i === ctx.nodeCount) {
                      config.set('compose.file', 'docker-compose.yml');
                      config.set('core.masternode.enable', false);
                    }

                    const configFiles = renderServiceTemplates(ctx[configReference]);
                    writeServiceConfigs(ctx[configReference].getName(), configFiles);
                  },
                },
                {
                  title: 'Initialize Tenderdash',
                  // eslint-disable-next-line consistent-return
                  skip: () => i === ctx.nodeCount,
                  task: () => tenderdashInitTask(ctx[configReference]),
                },
              ]),
            });
          }

          return new Listr(subTasks);
        },
      },
      {
        title: 'Interconnect Core nodes',
        task: (ctx) => {
          const p2pSeeds = [];
          for (let i = 0; i <= ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            const p2pPort = ctx[configReference].get('core.p2p.port');

            p2pSeeds.push({
              host: ctx.hostDockerInternalIp,
              port: p2pPort,
            });
          }

          for (let i = 0; i <= ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            ctx[configReference].set('core.p2p.seeds', p2pSeeds.filter((seed, index) => index !== i));
          }
        },
      },
      {
        title: 'Starting nodes',
        task: async (ctx) => {
          const coreServices = [];

          for (let i = 0; i <= ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            const config = ctx[configReference];

            const coreService = await startCore(config, { wallet: true, addressIndex: true });
            coreServices.push(coreService);

            // need to generate 1 block to connect nodes to each other
            if (i === 0) {
              await generateBlocks(
                coreService,
                1,
                config.get('network'),
              );
            }
          }

          ctx.coreServices = coreServices;
        },
      },
      {
        title: 'Register masternode',
        task: async (ctx, task) => {
          const subTasks = [];

          for (let i = 0; i < ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            const config = ctx[configReference];

            subTasks.push({
              title: `Register masternode #${i + 1}`,
              skip: () => {
                if (config.get('core.masternode.operator.privateKey')) {
                  task.skip(`Masternode operator private key ('core.masternode.operator.privateKey') is already set in ${config.getName()} config`);

                  return true;
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
                  title: 'Wait for sync',
                  task: async () => {
                    if (i > 0) {
                      await waitForCoreSync(ctx.coreService);
                    }
                  },
                },
                {
                  title: `Generate ${amount} dash to local wallet`,
                  task: () => generateToAddressTask(config, amount),
                },
                {
                  title: 'Register masternode',
                  task: () => registerMasternodeTask(config),
                },
                {
                  // hidden task to clear values
                  task: () => {
                    ctx.address = null;
                    ctx.privateKey = null;
                    ctx.coreService = null;
                  },
                },
              ]),
            });
          }

          // eslint-disable-next-line consistent-return
          return new Listr(subTasks);
        },
      },
      {
        title: 'Stopping nodes',
        task: async (ctx) => {
          for (const coreService of ctx.coreServices) {
            await coreService.stop();
          }
        },
      },
      {
        title: 'Interconnect Tenderdash nodes',
        task: (ctx) => {
          let genesisTime;
          const randomChainIdPart = Math.floor(Math.random() * 60) + 1;
          const chainId = `dash_masternode_local_${randomChainIdPart}`;

          const validators = [];
          for (let i = 0; i < ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            const validatorKey = ctx[configReference].get('platform.drive.tenderdash.validatorKey');

            validators.push({
              address: validatorKey.address,
              pub_key: validatorKey.pub_key,
              power: '1',
              name: `node${i}`,
            });
          }

          for (let i = 0; i < ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            if (i === 0) {
              genesisTime = ctx[configReference].get('platform.drive.tenderdash.genesis.genesis_time');
            }

            ctx[configReference].set('platform.drive.tenderdash.genesis.genesis_time', genesisTime);
            ctx[configReference].set('platform.drive.tenderdash.genesis.chain_id', chainId);

            const p2pPeers = [];
            for (let n = 0; n < ctx.nodeCount; n++) {
              if (n === i) {
                continue;
              }

              const nodeId = ctx[`config_${n + 1}`].get('platform.drive.tenderdash.nodeId');

              p2pPeers.push({
                id: nodeId,
                host: ctx.hostDockerInternalIp,
                port: 26656 + (n * 100),
              });
            }

            ctx[configReference].set('platform.drive.tenderdash.p2p.persistentPeers', p2pPeers);
            ctx[configReference].set('platform.drive.tenderdash.genesis.validators', validators);

            const configFiles = renderServiceTemplates(ctx[configReference]);
            writeServiceConfigs(ctx[configReference].getName(), configFiles);
          }
        },
      },
      {
        title: 'Starting nodes',
        task: async (ctx) => {
          const startNodeTasks = [];

          for (let i = 0; i <= ctx.nodeCount; i++) {
            startNodeTasks.push({
              title: `Starting node #${i + 1}`,
              task: () => startNodeTask(
                ctx[`config_${i + 1}`],
                {
                  driveImageBuildPath: ctx.driveImageBuildPath,
                  dapiImageBuildPath: ctx.dapiImageBuildPath,
                  // run miner only at controlling node
                  isMinerEnabled: i === ctx.nodeCount,
                },
              ),
            });
          }

          return new Listr(startNodeTasks);
        },
      },
      {
        title: 'Wait 20 seconds to ensure all services are running',
        task: async () => {
          await wait(20000);
        },
      },
      {
        title: 'Initialize Platform',
        task: (ctx) => initTask(ctx[`config_${ctx.nodeCount - 1}`]),
      },
      {
        title: 'Stopping nodes',
        task: async (ctx) => {
          const stopNodeTasks = [];

          for (let i = 0; i <= ctx.nodeCount; i++) {
            stopNodeTasks.push({
              title: `Stop node #${i + 1}`,
              task: async () => {
                await dockerCompose.stop(ctx[`config_${i + 1}`].toEnvs());
              },
            });
          }

          return new Listr(stopNodeTasks);
        },
      },
    ]);
  }

  return setupLocalPresetTask;
}

module.exports = setupLocalPresetTaskFactory;
