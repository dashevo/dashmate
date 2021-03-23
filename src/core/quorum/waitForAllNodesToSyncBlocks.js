/**
 *
 * Wait until everybody has the same tip.
 * ync_blocks needs to be called with an rpc_connections set that has least
 * one node already synced to the latest, stable tip, otherwise there's a
 * chance it might return before all nodes are stably synced.
 *
 * Use getblockcount() instead of waitforblockheight() to determine the
 * initial max height because the two RPCs look at different internal global
 * variables (chainActive vs latestBlock) and the former gets updated
 * earlier.
 *
 * @param {RpcClient[]} rpcClients
 * @param {number} wait
 * @param {number} timeout
 * @return {Promise<*>}
 */
async function waitForAllNodesToSyncBlocks(rpcClients, wait= 1000, timeout= 60000) {
  const heights = await Promise.all(
    rpcClients.map(rpc => {
      return getBlockCount(rpc);
    })
  );

  const maxHeight = Math.max(...heights);

  const deadline = Date.now() + timeout;
  let isReady = false;

  while (!isReady) {
    const tips = await Promise.all(rpcClients.map(rpc => {
      return waitForBlockHeight(rpc, maxHeight, wait);
    }));

    const allTipsAreSameHeight = tips
      .filter(tip => {
        return tip.height !== maxHeight;
      }).length === 0;

    let allTipsAreSameHash = false;

    if (allTipsAreSameHeight) {
      allTipsAreSameHash = tips
        .filter(tip => {
          return tip.hash !== tip[0].hash;
        }).length === 0;

      if (!allTipsAreSameHash) {
        throw new Error('Block sync failed, mismatched block hashes');
      }

      isReady = true;
    }

    if (Date.now() > deadline) {
      throw new Error(`Syncing blocks to height ${maxHeight} timed out`);
    }
  }
}

module.exports = waitForAllNodesToSyncBlocks;
