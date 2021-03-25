/**
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @return {Promise<boolean>}
 */
async function checkProbes(regtestNetwork) {
  const rpcClients = regtestNetwork.getAllRpcClients();

  for (const rpc of rpcClients) {
    const dkgStatus = rpc.quorum('dkgstatus');
    const { session, quorumConnections } = dkgStatus;

    if (Object.keys(session).length === 0) {
      continue;
    }

    if (!quorumConnections || !quorumConnections['llmq_test']) {
      await regtestNetwork.bumpMocktime(1);
      return false;
    }

    for (let connection of quorumConnections['llmq_test']) {
      // TODO: if connection is the current rpc node, skip
      if (!connection.outbound) {
        const mnInfo = await rpc.protx(connection.proTxHash);

        // TODO: add mnInfos to the functions
        for (masternode in mnInfos) {
          if (connection.protxHash === masternode.protxHash) {
            // MN is expected to be online and functioning, so let's verify that the last successful
            // probe is not too old. Probes are retried after 50 minutes, while DKGs consider a probe
            // as failed after 60 minutes
            if (mnInfo['metaInfo']['lastOutboundSuccessElapsed'] > 55 * 60) {
              await regtestNetwork.bumpMocktime(1);
              return false;
            }
          } else {
            // MN is expected to be offline, so let's only check that the last probe is not too long ago
            if (mnInfo['metaInfo']['lastOutboundAttemptElapsed'] > 55 * 60 && mnInfo['metaInfo']['lastOutboundSuccessElapsed'] > 55 * 60) {
              await regtestNetwork.bumpMocktime(1);
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

/**
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @param {number} [timeout]
 * @return {Promise<boolean>}
 */
async function waitForMasternodeProbes(regtestNetwork, timeout = 30000) {
  let isReady = false;
  let isOk = false;
  const deadline = Date.now() + timeout;

  while (!isReady) {
    isOk = await checkProbes(regtestNetwork);
    isReady = isOk;

    if (Date.now() > deadline) {
      isReady = true;
    }
  }

  return isOk;
}

module.exports = waitForMasternodeProbes;
