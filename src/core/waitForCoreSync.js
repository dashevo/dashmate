const wait = require('../util/wait');

/**
 * Wait Core to be synced
 *
 * @typedef {waitForCoreSync}
 * @param {CoreService} coreService
 * @return {Promise<void>}
 */
async function waitForCoreSync(coreService) {
  let isSynced = false;
  let isBlockchainSynced = false;

  do {
    ({ result: { IsSynced: isSynced, IsBlockchainSynced: isBlockchainSynced } } = await coreService.getRpcClient().mnsync('status'));

    if (!isSynced || !isBlockchainSynced) {
      await wait(10000);
    }
  } while (!isSynced || !isBlockchainSynced);
}

module.exports = waitForCoreSync;
