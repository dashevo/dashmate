const wait = require('../../util/wait');

/**
 *
 * @param {string} quorumHash
 * @param {RpcClient[]} rpcClients
 * @return {Promise<boolean>}
 */
async function checkDKGSessionCommitments(quorumHash, rpcClients) {
  let allOk = true;

  for (const rpc of rpcClients) {
    const { result: dkgStatus } = await rpc.quorum('dkgstatus');

    if (!dkgStatus.minableCommitments) {
      allOk = false;
      break;
    }

    const testQuorumCommitment = dkgStatus.minableCommitments["llmq_test"];

    if (!testQuorumCommitment) {
      allOk = false;
      break;
    }

    if (testQuorumCommitment.quorumHash !== quorumHash) {
      allOk = false;
      break;
    }
  }

  return allOk;
}

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {number} [timeout]
 * @param {number} [waitBeforeRetry]
 * @return {Promise<void>}
 */
async function waitForQuorumCommitments(rpcClients,quorumHash, timeout = 60000, waitBeforeRetry = 100) {
  const deadline = Date.now() + timeout;
  let isReady = false;

  while (!isReady) {
    await wait(waitBeforeRetry);

    isReady = await checkDKGSessionCommitments(quorumHash, rpcClients);

    if (Date.now() > deadline) {
      throw new Error(`waitForQuorumCommitments deadline of ${timeout} exceeded`);
    }
  }
}

module.exports = waitForQuorumCommitments;
