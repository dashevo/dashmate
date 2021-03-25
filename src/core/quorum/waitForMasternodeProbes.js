/**
 * Checks all mastrenodoes probes to incterconnected masternodes
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @return {Promise<boolean>}
 */
async function checkProbes(regtestNetwork) {
  const rpcClients = regtestNetwork.getAllRpcClients();

  let masternodes = await Promise.all(rpcClients.map(async (rpc) => {
    const { result: status } = await rpc.masternode('status');
    return { rpc, status };
  }));

  masternodes = masternodes.filter(entry => !entry.status);

  for (const { rpc, status } of masternodes) {
    const { result: { session, quorumConnections } } = await rpc.quorum('dkgstatus');

    if (Object.keys(session).length === 0) {
      continue;
    }

    if (!quorumConnections || !quorumConnections['llmq_test']) {
      await regtestNetwork.bumpMocktime(1);
      return false;
    }

    for (let connection of quorumConnections['llmq_test']) {
      if (connection.proTxHash === status.proTxHash) {
        continue;
      }

      if (!connection.outbound) {
        const { result: mnInfo } = await rpc.protx('info', connection.proTxHash);

        for (const masternode in masternodes) {
          if (connection.proTxHash === masternode.status.proTxHash) {
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
