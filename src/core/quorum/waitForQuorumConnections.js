const wait = require('../../util/wait');

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {number} expectedConnectionsCount
 * @return {Promise<boolean>}
 */
async function checkQuorumConnections(rpcClients, expectedConnectionsCount) {
  let allOk = true;

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
    await bumpMockTimeForNodes(1, rpcClients);
    await wait(1000);
  }

  return allOk;
}

/**
 *
 * @param {number} expectedConnectionsCount
 * @param {RpcClient[]} rpcClients
 * @param {number} [timeout]
 * @return {Promise<boolean>}
 */
async function waitForQuorumConnections(expectedConnectionsCount, rpcClients, timeout= 60000) {
  let isReady = false;
  let isOk = false;
  const deadline = Date.now() + timeout;

  while (!isReady) {
    isOk = await checkQuorumConnections(rpcClients, expectedConnectionsCount);
    isReady = isOk;

    if (Date.now() > deadline) {
      isReady = true;
    }
  }

  return isOk;
}

module.exports = waitForQuorumConnections;
