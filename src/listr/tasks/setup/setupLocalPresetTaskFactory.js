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
            message: 'Enter the number of nodes',
            initial: 2,
            float: false,
            min: 1,
            max: 6,
            validate: (state) => {
              if (+state < 1 || +state > 6) {
                return 'You must set from 1 up to 6 nodes';
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
          const writableStream = new WritableStream();

          const [result] = await docker.run(
            'alpine',
            [],
            writableStream,
            {
              Entrypoint: ['sh', '-c', 'nslookup host.docker.internal'],
              HostConfig: {
                AutoRemove: true,
              },
            },
          );

          const output = writableStream.toString();

          if (result.StatusCode !== 0) {
            throw new Error(`Can't get host.docker.internal IP address: ${output}`);
          }

          const [ipAddress] = output.match(/((?:[0-9]{1,3}\.){3}[0-9]{1,3})/g);

          ctx.hostDockerInternalIp = ipAddress;
        },
      },
      {
        // hidden task to dynamically create
        // multinode tasks listr
        task: (ctx) => {
          const subTasks = [];

          for (let i = 0; i < ctx.nodeCount; i++) {
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
                      ctx[configReference] = configFile.createConfig(configName, PRESET_LOCAL);
                    }

                    const config = ctx[configReference];

                    config.set('description', `config for local node #${i + 1}`);
                    config.set('core.p2p.port', 20001 + (i * 100));
                    config.set('core.rpc.port', 20002 + (i * 100));

                    const p2pSeeds = [];
                    for (let n = 0; n < ctx.nodeCount; n++) {
                      if (n === i) {
                        continue;
                      }

                      p2pSeeds.push({
                        host: 'host.docker.internal',
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

                    const configFiles = renderServiceTemplates(ctx[configReference]);
                    writeServiceConfigs(ctx[configReference].getName(), configFiles);
                  },
                },
                {
                  title: `Generate ${amount} dash to local wallet`,
                  task: () => generateToAddressTask(ctx[configReference], amount),
                },
                {
                  title: 'Register masternode',
                  task: () => registerMasternodeTask(ctx[configReference]),
                },
                {
                  title: 'Initialize Tenderdash',
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
          for (let i = 0; i < ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            const p2pPort = ctx[configReference].get('core.p2p.port');

            p2pSeeds.push({
              host: ctx.hostDockerInternalIp,
              port: p2pPort,
            });
          }

          for (let i = 0; i < ctx.nodeCount; i++) {
            const configReference = `config_${i + 1}`;

            ctx[configReference].set('core.p2p.seeds', p2pSeeds);
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
                host: 'host.docker.internal',
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

          for (let i = 0; i < ctx.nodeCount; i++) {
            startNodeTasks.push({
              title: `Starting node #${i + 1}`,
              task: () => startNodeTask(
                ctx[`config_${i + 1}`],
                {
                  driveImageBuildPath: ctx.driveImageBuildPath,
                  dapiImageBuildPath: ctx.dapiImageBuildPath,
                  isMinerEnabled: true,
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
        task: (ctx) => initTask(ctx.config_1),
      },
      {
        title: 'Stopping nodes',
        task: async (ctx) => {
          const stopNodeTasks = [];

          for (let i = 0; i < ctx.nodeCount; i++) {
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
