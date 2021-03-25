/**
 * Wait for all nodes to reach the height of the most advanced chain
 * @param {RpcClient[]} rpcClients
 * @param {number} [timeout] - timeout throw error if blocks aren't synced on all nodes
 * @param {number} [waitTime] - wait interval
 * @return {Promise<void>}
 */
async function waitForNodesToHaveTheSameHeight(rpcClients, timeout = 60000, waitTime= 1000) {
  const heights = await Promise.all(
    rpcClients.map(async (rpc) => {
      const { result: blockCount } = await rpc.getBlockCount();
      return blockCount;
    })
  );

  const maxHeight = Math.max(...heights);

  const deadline = Date.now() + timeout;
  let isReady = false;

  while (!isReady) {
    const tips = await Promise.all(rpcClients.map(async (rpc) => {
      const { result: tip } = await rpc.waitForBlockHeight(maxHeight, waitTime);
      return tip;
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

module.exports = waitForNodesToHaveTheSameHeight;
