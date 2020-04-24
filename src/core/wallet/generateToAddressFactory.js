const path = require('path');

const SATOSHI_MULTIPLIER = 10 ** 8;

/**
 * Generate new address with requested amount of dash
 *
 * @param {Object} logger
 * @property {function} log
 * @property {function} info
 * @property {function} warn
 * @property {function} error
 * @param {Docker} docker
 * @param {Object} compose
 * @param {RpcClient} coreClient
 * @param {waitForCoreStart} waitForCoreStart
 * @param {waitForCoreSync} waitForCoreSync
 * @returns {generateToAddress}
 */
function generateToAddressFactory(
  logger,
  docker,
  compose,
  coreClient,
  waitForCoreStart,
  waitForCoreSync,
) {
  /**
   *
   * @typedef generateToAddress
   * @param {string} preset
   * @param {number} amount
   * @param {string|null} [addressToGenerate]
   * @returns {Promise<void>}
   */
  async function generateToAddress(preset, amount, addressToGenerate = null) {
    const options = {
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

    const command = 'dashd -conf=/dash/.dashcore/dash.conf -datadir=/dash/data --disablewallet=0 -port=20001';

    let container;

    try {
      // start dash core
      let containerName;
      let exitCode;

      try {
        ({ out: containerName, exitCode } = await compose.run('core', command, options));
      } catch (e) {
        throw new Error(`Cannot start service:\n Exit code: ${e.exitCode}\n Error: ${e.err}\n Output: ${e.out}\n`);
      }

      if (exitCode !== 0) {
        throw new Error('Cannot start service');
      }

      container = docker.getContainer(containerName.trim());

      // wait dash core to start
      await waitForCoreStart();

      // wait dash core to be synced
      if (preset !== 'local') {
        await waitForCoreSync();
      }

      let address = addressToGenerate;
      let privateKey = null;

      if (address === null) {
        ({ result: address } = await coreClient.getNewAddress());
        ({ result: privateKey } = await coreClient.dumpPrivKey(address));
      }

      let addressBalance = 0;

      // generate dash to new address
      do {
        logger.info('Generating dashes...');

        await coreClient.generateToAddress(1, address, 10000000);

        const { result: { balance } } = await coreClient.getAddressBalance({
          addresses: [address],
        });

        addressBalance = balance / SATOSHI_MULTIPLIER;

        logger.info(`Generated ${addressBalance} dash`);
      } while (addressBalance < amount);

      if (preset === 'local') {
        // generate 100 blocks to unlock dash
        await coreClient.generate(100);
      }

      logger.info(`Address: ${address}\nPrivate key: ${privateKey}`);
      logger.info(`Balance is ${addressBalance} dash`);

      if (preset !== 'local') {
        logger.info('You need to wait at least 100 block before registering masternode');
      }
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new Error(`Error: ${JSON.stringify(e)}`);
      } else {
        throw e;
      }
    } finally {
      // close dash core
      if (container) {
        const { State: state } = await container.inspect();

        if (state === 'running') {
          await container.stop();
          await container.remove();
        }
      }
    }
  }

  return generateToAddress;
}


module.exports = generateToAddressFactory;
