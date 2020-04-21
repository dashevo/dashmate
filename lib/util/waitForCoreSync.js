const wait = require('./wait');

/**
 * Wait for Dash core to sync with network
 *
 * @param {RpcClient} coreClient
 * @returns {Promise<void>}
 */
async function waitForCoreSync(coreClient) {
  let isSynced = false;
  do {
    ({ result: { IsSynced: isSynced } } = await coreClient.mnsync('status'));
    if (!isSynced) {
      await wait(10000);

      console.info('Waiting core to be synced');
    }
  } while (!isSynced);
}

module.exports = waitForCoreSync;
