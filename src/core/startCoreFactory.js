const path = require('path');

const CoreService = require('./CoreService');
const CoreStartError = require('./errors/CoreStartError');

/**
 * @param {createRpcClient} createRpcClient
 * @param {waitForCoreStart} waitForCoreStart
 * @param {waitForCoreSync} waitForCoreSync
 * @param {Object} dockerCompose
 * @param {Docker} docker
 * @return {startCore}
 */
function startCoreFactory(
  createRpcClient,
  waitForCoreStart,
  waitForCoreSync,
  dockerCompose,
  docker,
) {
  /**
   * @typedef startCore
   * @param {string} preset
   * @param {Object} [options]
   * @param {boolean} [options.wallet=false]
   * @return {CoreService}
   */
  async function startCore(preset, options = {}) {
    // eslint-disable-next-line no-param-reassign
    options = { wallet: false, ...options };

    // Start Core

    const dockerComposeRunOptions = {
      cwd: path.join(__dirname, '../../../'),
      config: 'docker-compose.yml',
      composeOptions: [
        '--env-file', `.env.${preset}`,
      ],
      commandOptions: [
        '--publish=20002:20002',
        '--detach',
      ],
    };

    const coreCommand = [
      'dashd',
      '-conf=/dash/.dashcore/dash.conf',
      '-datadir=/dash/data',
      '-port=20001',
    ];

    if (options.wallet) {
      coreCommand.push('--disablewallet=0');
    }

    let dockerContainerName;

    try {
      ({ out: dockerContainerName } = await dockerCompose.run(
        'core',
        coreCommand,
        dockerComposeRunOptions,
      ));
    } catch (e) {
      throw new CoreStartError(e);
    }

    const rpcClient = createRpcClient();
    const dockerContainer = docker.getContainer(dockerContainerName.trim());

    const coreService = new CoreService(
      rpcClient,
      dockerContainer,
    );

    // Wait Core to start
    await waitForCoreStart(coreService);

    // Wait Core to be synced
    if (preset !== 'local') {
      await waitForCoreSync(coreService);
    }

    return coreService;
  }

  return startCore;
}

module.exports = startCoreFactory;
