const path = require('path');
const RpcClient = require('@dashevo/dashd-rpc/promise');
const compose = require('docker-compose');
const waitForCoreStart = require('../util/waitForCoreStart');
const waitForCoreSync = require('../util/waitForCoreSync');
const generateLocalBlocks = require('../util/generateLocalBlocks');

const SATOSHI_MULTIPLIER = 10 ** 8;

/**
 * Generate new address with requested amount of dash
 *
 * @param {string} preset
 * @param {number} amount
 * @returns {Promise<void>}
 */
async function getNewAddress(preset, amount) {
  let address;
  let privateKey;

  const composeOptions = {
    cwd: path.join(__dirname, '../'),
    config: 'docker-compose.yml',
    composeOptions: [
      '--env-file', `../.env.${preset}`,
    ],
  };

  try {
    // start dash core
    await compose.upOne('core', composeOptions);

    const dashcoreConfig = {
      protocol: 'http',
      user: 'dashrpc',
      pass: 'password',
      host: '127.0.0.1',
      port: 20002,
    };

    const coreClient = new RpcClient(dashcoreConfig);

    // wait dash core to start
    await waitForCoreStart(coreClient);

    // wait dash core to be synced
    if (preset !== 'local') {
      await waitForCoreSync(coreClient);
    }

    ({ result: address } = await coreClient.getNewAddress());
    ({ result: privateKey } = await coreClient.dumpPrivKey(address));

    let addressBalance = 0;

    // generate dash to new address
    do {
      console.info('Generating dashes...');

      await coreClient.generateToAddress(1, address, 10000000);

      const { result: { balance } } = await coreClient.getAddressBalance({
        addresses: [address],
      });

      addressBalance = balance / SATOSHI_MULTIPLIER;

      console.info(`Generated ${addressBalance} dash`);
    } while (addressBalance < amount);

    if (preset === 'local') {
      // generate some blocks to unlock dash
      await generateLocalBlocks(coreClient, 100);
    }

    console.info(`Address: ${address}\nPrivate key: ${privateKey}`);
    console.info(`Balance is ${addressBalance} dash`);

    if (preset !== 'local') {
      console.info('You need to wait at least 100 block before registering masternode');
    }
  } catch (e) {
    console.error(e);
  } finally {
    // close dash core
    await compose.stopOne('core', composeOptions);
    await compose.rm(composeOptions);
  }
}

module.exports = getNewAddress;
