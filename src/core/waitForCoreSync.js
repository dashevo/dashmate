const wait = require('../util/wait');

/**
 * Wait Core to be synced
 *
 * @typedef {waitForCoreSync}
 * @param {CoreService} coreService
 * @param {task} task
 * @return {Promise<void>}
 */
async function waitForCoreSync(coreService, task) {
  let isSynced = false;
  let verificationProgress = 0.0;

  do {
    ({
      result: { IsSynced: isSynced },
    } = await coreService.getRpcClient().mnsync('status'));
    ({
      result: { verificationprogress: verificationProgress },
    } = await coreService.getRpcClient().getBlockchainInfo());

    if (!isSynced) {
      await wait(10000);

      // eslint-disable-next-line no-param-reassign
      task.output = `${(verificationProgress * 100).toFixed(2)}% complete`;
    }
  } while (!isSynced);
}

module.exports = waitForCoreSync;
