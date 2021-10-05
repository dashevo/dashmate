const wait = require('../util/wait');

/**
 * Wait Core to be synced
 *
 * @typedef {waitForCoreSync}
 * @param {RpcClient} rpcClient
 * @param {function(progress: number)} [progressCallback]
 * @return {Promise<void>}
 */
async function waitForMasternodesSync(rpcClient, progressCallback = () => {}) {
  let isSynced = false;
  let verificationProgress = 0.0;

  // Wait for RPC to be ready
  let isReady = false;
  do {
    try {
      await wait(10);
      await rpcClient.mnsync('status');
    } catch (e) {
      if (e.code !== -28) {
        throw e;
      } else {
        continue;
      }
    }
    isReady = true;
  } while (!isReady);

  do {
    await rpcClient.mnsync('next');

    ({
      result: { IsSynced: isSynced },
    } = await rpcClient.mnsync('status'));
    ({
      result: { verificationprogress: verificationProgress },
    } = await rpcClient.getBlockchainInfo());

    if (!isSynced) {
      progressCallback(verificationProgress);

      await wait(300);
    }
  } while (!isSynced);
}

module.exports = waitForMasternodesSync;
