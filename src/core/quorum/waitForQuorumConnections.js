const wait = require('../../util/wait');

/**
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @param {number} expectedConnectionsCount
 * @return {Promise<boolean>}
 */
async function checkQuorumConnections(regtestNetwork, expectedConnectionsCount) {
  let allOk = true;
  const rpcClients = regtestNetwork.getAllRpcClients();

  for (const rpc of rpcClients) {
    const { result: dkgStatus } = await rpc.quorum('dkgstatus');

    if (Object.keys(dkgStatus.session).length === 0) {
      continue;
    }

    const noConnections = dkgStatus.quorumConnections == null;
    const llmqConnections = dkgStatus.quorumConnections;
    const noLlmqTestConnections = noConnections || llmqConnections['llmq_test'] == null;

    if (noLlmqTestConnections) {
      allOk = false;
      break;
    }

    let connectionsCount = 0;

    for (let connection of llmqConnections['llmq_test']) {
      if (connection.connected) {
        connectionsCount += 1;
      }
    }

    if (connectionsCount < expectedConnectionsCount) {
      allOk = false;
      break;
    }
  }

  if (!allOk) {
    await regtestNetwork.bumpMocktime(1);
    await wait(1000);
  }

  return allOk;
}

/**
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @param {number} expectedConnectionsCount
 * @param {number} [timeout]
 * @return {Promise<boolean>}
 */
async function waitForQuorumConnections(regtestNetwork, expectedConnectionsCount, timeout= 60000) {
  let isReady = false;
  let isOk = false;
  const deadline = Date.now() + timeout;

  while (!isReady) {
    isOk = await checkQuorumConnections(regtestNetwork, expectedConnectionsCount);
    isReady = isOk;

    if (Date.now() > deadline) {
      isReady = true;
    }
  }

  return isOk;
}

module.exports = waitForQuorumConnections;
