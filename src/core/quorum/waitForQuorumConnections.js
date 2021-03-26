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

    const llmqTestConnections = llmqConnections['llmq_test'];

    let connectionsCount = 0;

    console.dir(llmqTestConnections);

    for (let connection of llmqTestConnections) {
      if (connection.connected) {
        connectionsCount += 1;
      }
    }

    if (connectionsCount < expectedConnectionsCount) {
      console.log('Expected', expectedConnectionsCount, 'connections, got', connectionsCount);
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
 * @return {Promise<void>}
 */
async function waitForQuorumConnections(regtestNetwork, expectedConnectionsCount, timeout= 60000) {
  const deadline = Date.now() + timeout;
  let isReady = false;

  while (!isReady) {
    isReady = await checkQuorumConnections(regtestNetwork, expectedConnectionsCount);

    if (Date.now() > deadline) {
      throw new Error(`waitForQuorumConnections deadline of ${timeout} exceeded`);
    }
  }
}

module.exports = waitForQuorumConnections;
