/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {number} phase
 * @param {number} expectedMemberCount
 * @param {string} [checkReceivedMessages]
 * @param {number} [checkReceivedMessagesCount]
 * @return {Promise<boolean>}
 */
async function checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessages, checkReceivedMessagesCount = 0) {
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
    const receivedMessagesDoNotMatch = checkReceivedMessages && llmqSession[checkReceivedMessages] < checkReceivedMessagesCount;

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
 * @return {Promise<boolean>}
 */
async function waitForQuorumPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessagesType, checkReceivedMessagesCount, timeout = 30000, checkInterval = 100) {
  const deadline = Date.now() + timeout;
  let isReady = false;
  let dkgSessionIsOk = false;

  while (isReady) {
    await wait(checkInterval);
    const dkgSessionIsOk = await checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessagesType, checkReceivedMessagesCount);
    if (dkgSessionIsOk) {
      isReady = true;
    }

    if (Date.now() > deadline) {
      throw new Error(`waitForQuorumPhase deadline of ${timeout} exceeded`);
    }
  }

  return dkgSessionIsOk;
}


module.exports = waitForQuorumPhase;
