const wait = require('../../util/wait');

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {number} phase
 * @param {number} expectedMemberCount
 * @param {string} [checkReceivedMessagesType]
 * @param {number} [checkReceivedMessagesCount]
 * @return {Promise<boolean>}
 */
async function checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessagesType, checkReceivedMessagesCount = 0) {
  let allOk = true;
  let memberCount = 0;

  for (let rpc of rpcClients) {
    const { result: dkgStatus } = await rpc.quorum("dkgstatus");
    const { session } = dkgStatus;

    if (!session.hasOwnProperty("llmq_test")) {
      continue;
    }

    memberCount +=1;
    const llmqSession = session.llmq_test;

    const quorumHashDoesntMatch = llmqSession.quorumHash !== quorumHash;
    const sessionPhaseDoesntMatch = !llmqSession.hasOwnProperty("phase") || llmqSession.phase !== phase;
    const receivedMessagesDoNotMatch = checkReceivedMessagesType && llmqSession[checkReceivedMessagesType] < checkReceivedMessagesCount;

    const checkFailed = quorumHashDoesntMatch || sessionPhaseDoesntMatch || receivedMessagesDoNotMatch;

    if (checkFailed) {
      allOk = false;
      break;
    }
  }

  if (allOk && memberCount !== expectedMemberCount) {
    return false;
  }

  return allOk;
}

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {number} phase
 * @param {number} expectedMemberCount
 * @param {string} [checkReceivedMessagesType]
 * @param {number} [checkReceivedMessagesCount]
 * @param {number} [timeout]
 * @param {number} [checkInterval]
 * @return {Promise<void>}
 */
async function waitForQuorumPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessagesType, checkReceivedMessagesCount, timeout = 30000, checkInterval = 100) {
  const deadline = Date.now() + timeout;
  let isReady = false;

  while (isReady) {
    await wait(checkInterval);
    isReady = await checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessagesType, checkReceivedMessagesCount);

    if (Date.now() > deadline) {
      throw new Error(`waitForQuorumPhase deadline of ${timeout} exceeded`);
    }
  }
}


module.exports = waitForQuorumPhase;
