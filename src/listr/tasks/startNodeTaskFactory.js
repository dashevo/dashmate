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
          // async function waitStream() {
          //   // eslint-disable-next-line no-new
          //   new Promise((resolve, reject) => {
          //     const pullCommand = dockerCompose.pull(config.toEnvs());
          //     // eslint-disable-next-line no-param-reassign
          //     task.output = pullCommand.out;
          //     pullCommand.then(resolve)
          //       .catch(() => reject(new Error('Updating services failed')));
          //   });
          // }
          // await waitStream();

          // Doesn't wait

          // ---------------------------------------------------------------------

          // await new Promise((resolve, reject) => {
          //   const readable = Readable.from(dockerCompose.pull(config.toEnvs()));
          //   readable.on('data', (chunk) => {
          //     // eslint-disable-next-line no-param-reassign
          //     task.output = chunk;
          //   });
          //   readable.on('end', resolve);
          //   readable.on('error', (error) => {
          //     throw new Error(error);
          //   });
          // });

          // The "iterable" argument must be an instance of Iterable. Received an instance of Promise

          // ---------------------------------------------------------------------

          // let streamy = '';
          // const theObserver = new Observable((observer) => {
          //   streamy = from(dockerCompose.pull(config.toEnvs()));
          // });
          // theObserver.subscribe(task.output);
          // streamy.pipe(task.output);

          // pipe_1.pipeFromArray(...) is not a function

          // ---------------------------------------------------------------------

          // eslint-disable-next-line no-new
          // await new Promise((resolve, reject) => {
          //   const pullCommand = dockerCompose.pull(config.toEnvs());
          //   const streamy = from(pullCommand);
          //   streamy.pipe(task.output);
          //   pullCommand.then(resolve)
          //     .catch(() => reject(new Error('Updating services failed')));
          //   // pullCommand.stdout.pipe(task.output);
          // });
          // eslint-disable-next-line no-param-reassign
          // task.output = await dockerCompose.pull(config.toEnvs());

          // pipe_1.pipeFromArray(...) is not a function
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
