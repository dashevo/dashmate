const { from, Observable } = require('rxjs');

const { Listr } = require('listr2');

const { PrivateKey } = require('@dashevo/dashcore-lib');

const { Readable } = require('stream');

const NETWORKS = require('../../networks');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @return {startNodeTask}
 */
function startNodeTaskFactory(dockerCompose) {
  /**
   * @typedef {startNodeTask}
   * @param {Config} config
   * @param {Object} options
   * @param {string} [options.driveImageBuildPath]
   * @param {string} [options.dapiImageBuildPath]
   * @param {boolean} [options.isMinerEnabled]
   * @return {Object}
   */
  function startNodeTask(
    config,
    {
      driveImageBuildPath = undefined,
      dapiImageBuildPath = undefined,
      isMinerEnabled = undefined,
    },
  ) {
    // Check external IP is set
    config.get('externalIp', true);

    if (isMinerEnabled === undefined) {
      // eslint-disable-next-line no-param-reassign
      isMinerEnabled = config.get('core.miner.enable');
    }

    if (isMinerEnabled === true && config.get('network') !== NETWORKS.LOCAL) {
      throw new Error(`'core.miner.enabled' option only works with local network. Your network is ${config.get('network')}.`);
    }

    return new Listr([
      {
        title: 'Check node is not started',
        task: async () => {
          if (await dockerCompose.isServiceRunning(config.toEnvs())) {
            throw new Error('Running services detected. Please ensure all services are stopped for this config before starting');
          }
        },
      },
      {
        title: 'Download updated services',
        task: async (ctx, task) => {
          async function logChunks(readable) {
            for await (const chunk of readable) {
              task.output = chunk.out;
            }
          }

          const log = await dockerCompose.pull(config.toEnvs());

          logChunks(log);
        },
      },
      // Why do we need to build if images are already available on Docker Hub?
      // {
      //   title: 'Build services',
      //   task: async () => dockerCompose.(config.toEnvs()),
      // },
      {
        title: 'Start services',
        // enabled: () => false,
        task: async (task) => {
          const isMasternode = config.get('core.masternode.enable');
          if (isMasternode) {
            // Check operatorPrivateKey is set
            config.get('core.masternode.operator.privateKey', true);
          }

          const envs = config.toEnvs();

          if (driveImageBuildPath || dapiImageBuildPath) {
            if (config.get('network') === NETWORKS.MAINNET) {
              throw new Error('You can\'t use drive-image-build-path and dapi-image-build-path options with mainnet network');
            }

            if (driveImageBuildPath) {
              envs.COMPOSE_FILE += ':docker-compose.platform.build-drive.yml';
              envs.PLATFORM_DRIVE_DOCKER_IMAGE_BUILD_PATH = driveImageBuildPath;
            }

            if (dapiImageBuildPath) {
              envs.COMPOSE_FILE += ':docker-compose.platform.build-dapi.yml';
              envs.PLATFORM_DAPI_DOCKER_IMAGE_BUILD_PATH = dapiImageBuildPath;
            }
          }

          // eslint-disable-next-line no-param-reassign
          task.output = dockerCompose.up(envs);
        },
      },
      {
        title: 'Start a miner',
        enabled: () => isMinerEnabled === true,
        task: async () => {
          let minerAddress = config.get('core.miner.address');

          if (minerAddress === null) {
            const privateKey = new PrivateKey();
            minerAddress = privateKey.toAddress('regtest').toString();

            config.set('core.miner.address', minerAddress);
          }

          const minerInterval = config.get('core.miner.interval');

          await dockerCompose.execCommand(
            config.toEnvs(),
            'core',
            [
              'bash',
              '-c',
              `while true; do dash-cli generatetoaddress 1 ${minerAddress}; sleep ${minerInterval}; done`,
            ],
            ['--detach'],
          );
        },
      }],
    { rendererOptions: { collapse: true, bottomBar: true } });
  }

  return startNodeTask;
}

module.exports = startNodeTaskFactory;
