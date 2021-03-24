const wait = require('../../util/wait');

/**
 *
 * @param {string} quorumHash
 * @param {RpcClient[]} rpcClients
 * @return {Promise<boolean>}
 */
async function checkDKGSessionCommitments(quorumHash, rpcClients) {
  // This one doesn't have a wait stage
  let allOk = true;

  for (const rpc of rpcClients) {
    const { result: dkgStatus } = rpc.quorum('dkgstatus');

    if (!dkgStatus.minableCommitments) {
      allOk = false;
      break;
    }

    const commitments = dkgStatus.minableCommitments;

    if (!commitments["llmq_test"]) {
      allOk = false;
      break;
    }

    const quorum = commitments["llmq_test"];
    if (quorum.quorumHash !== quorumHash) {
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
 * @return {Promise<boolean>}
 */
async function waitForQuorumCommitments(rpcClients,quorumHash, timeout = 15000, waitBeforeRetry = 100) {
  let isReady = false;
  let isOk = false;
  const deadline = Date.now() + timeout;

  while (!isReady) {
    await wait(waitBeforeRetry);

    isOk = await checkDKGSessionCommitments(rpcClients);
    isReady = isOk;

    if (Date.now() > deadline) {
      isReady = true;
    }
  }

  return isOk;
}

module.exports = waitForQuorumCommitments;
