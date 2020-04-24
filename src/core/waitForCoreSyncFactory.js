const wait = require('../util/wait');

/**
 * Wait for Dash core to sync with network
 *
 * @param {Object} logger
 * @property {function} log
 * @property {function} info
 * @property {function} warn
 * @property {function} error
 * @param {RpcClient} coreClient
 * @return {waitForCoreSync}
 */
function waitForCoreSyncFactory(logger, coreClient) {
  /**
   * @typedef waitForCoreSync
   * @returns {Promise<void>}
   */
  async function waitForCoreSync() {
    let isSynced = false;
    do {
      ({ result: { IsSynced: isSynced } } = await coreClient.mnsync('status'));
      if (!isSynced) {
        await wait(10000);

        logger.info('Waiting core to be synced');
      }
    } while (!isSynced);
  }

  return waitForCoreSync;
}
module.exports = waitForCoreSyncFactory;
