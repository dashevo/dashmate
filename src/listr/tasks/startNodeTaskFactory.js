const fs = require('fs');

const { Listr } = require('listr2');

const { PrivateKey } = require('@dashevo/dashcore-lib');
const { NETWORK_LOCAL } = require('../../constants');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @param {waitForCorePeersConnected} waitForCorePeersConnected
 * @param {createRpcClient} createRpcClient
 * @return {startNodeTask}
 */
function startNodeTaskFactory(
  dockerCompose,
  waitForCorePeersConnected,
  createRpcClient,
) {
  /**
   * @typedef {startNodeTask}
   * @param {Config} config
   * @param {Object} [options]
   * @param {boolean} [options.isUpdate]
   * @param {boolean} [options.isMinerEnabled]
   * @return {Object}
   */
  function startNodeTask(
    config,
    {
      isUpdate = undefined,
      isMinerEnabled = undefined,
    } = {},
  ) {
    // Check external IP is set
    config.get('externalIp', true);

    if (isMinerEnabled === undefined) {
      // eslint-disable-next-line no-param-reassign
      isMinerEnabled = config.get('core.miner.enable');
    }

    if (isMinerEnabled === true && config.get('network') !== NETWORK_LOCAL) {
      throw new Error(`'core.miner.enabled' option only works with local network. Your network is ${config.get('network')}.`);
    }

    // Check Drive log files are created
    const prettyFilePath = config.get('platform.drive.abci.log.prettyFile.path');

    if (!fs.existsSync(prettyFilePath)) {
      fs.writeFileSync(prettyFilePath, '');
    }

    const jsonFilePath = config.get('platform.drive.abci.log.jsonFile.path');

    if (!fs.existsSync(jsonFilePath)) {
      fs.writeFileSync(jsonFilePath, '');
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
        title: 'Download updates',
        enabled: () => isUpdate === true,
        task: async () => dockerCompose.pull(config.toEnvs()),
      },
      {
        title: 'Build DAPI from sources',
        enabled: config.has('platform')
          && config.get('platform.dapi.api.docker.build') != null,
        task: async () => {
          const envs = config.toEnvs();

          await dockerCompose.build(envs, 'dapi_api');
        },
      },
      {
        title: 'Build Drive from sources',
        enabled: config.has('platform')
          && config.get('platform.drive.abci.docker.build.path') !== null,
        task: async () => {
          const envs = config.toEnvs();

          await dockerCompose.build(envs, 'drive_abci');
        },
      },
      {
        title: 'Start services',
        task: async () => {
          const isMasternode = config.get('core.masternode.enable');
          if (isMasternode) {
            // Check operatorPrivateKey is set
            config.get('core.masternode.operator.privateKey', true);
          }

          const envs = config.toEnvs();

          await dockerCompose.up(envs);
        },
      },
      {
        title: 'Await for peer to be connected',
        enabled: () => isMinerEnabled === true,
        task: async () => {
          const rpcClient = createRpcClient({
            port: config.get('core.rpc.port'),
            user: config.get('core.rpc.user'),
            pass: config.get('core.rpc.password'),
          });

          await waitForCorePeersConnected(rpcClient);
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
      }]);
  }

  return startNodeTask;
}

module.exports = startNodeTaskFactory;
