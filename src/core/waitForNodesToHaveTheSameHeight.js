async function waitForNodesToHaveTheSameHeight(rpcClients) {
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

module.exports = waitForNodesToHaveTheSameHeight;
