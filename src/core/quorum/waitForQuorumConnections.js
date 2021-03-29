const wait = require('../../util/wait');

const { LLMQ_TYPE_TEST } = require('../../constants');

/**
 * @param {RpcClient[]} rpcClients
 * @param {number} expectedConnectionsCount
 * @return {Promise<boolean>}
 */
async function checkQuorumConnections(rpcClients, expectedConnectionsCount) {
  for (const rpc of rpcClients) {
    const { result: dkgStatus } = await rpc.quorum('dkgstatus');

    if (Object.keys(dkgStatus.session).length === 0) {
      continue;
    }

    const noConnections = dkgStatus.quorumConnections == null;
    const llmqConnections = dkgStatus.quorumConnections;
    const noLlmqTestConnections = noConnections || llmqConnections[LLMQ_TYPE_TEST] == null;

    if (noLlmqTestConnections) {
      return false;
    }

    const llmqTestConnections = llmqConnections[LLMQ_TYPE_TEST];

    let connectionsCount = 0;

    for (const connection of llmqTestConnections) {
      if (connection.connected) {
        connectionsCount += 1;
      }
    }

    if (connectionsCount < expectedConnectionsCount) {
      return false;
    }
  }

  return true;
}

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {number} expectedConnectionsCount
 * @param {Function} bumpMockTime
 * @param {number} [timeout]
 * @return {Promise<void>}
 */
async function waitForQuorumConnections(
  rpcClients,
  expectedConnectionsCount,
  bumpMockTime,
  timeout = 300000,
) {
  const deadline = Date.now() + timeout;
  let isReady = false;

  while (!isReady) {
    isReady = await checkQuorumConnections(
      rpcClients,
      expectedConnectionsCount,
    );

    if (!isReady) {
      await bumpMockTime();

      await wait(1000);
    }

    if (Date.now() > deadline) {
      throw new Error(`waitForQuorumConnections deadline of ${timeout} exceeded`);
    }
  }
}

module.exports = waitForQuorumConnections;
