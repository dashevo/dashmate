/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {} phase
 * @param {number} expectedMemberCount
 * @param {*} checkReceivedMessages
 * @param {number} checkReceivedMessagesCount
 * @param timeout
 * @param checkInterval
 * @return {Promise<boolean>}
 */
async function waitForQuorumPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessages, checkReceivedMessagesCount, timeout = 30000, checkInterval = 100) {
  const timeOut = Date.now() + timeout;
  let isReady = false;
  let dkgSessionIsOk = false;

  while (isReady) {
    await wait(checkInterval);
    const dkgSessionIsOk = await checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessages, checkReceivedMessagesCount);
    if (dkgSessionIsOk || Date.now() > timeOut) {
      isReady = true;
    }
  }

  return dkgSessionIsOk;
}

/**
 *
 * @param {RpcClient[]} rpcClients
 * @param {string} quorumHash
 * @param {} phase
 * @param {number} expectedMemberCount
 * @param {*} checkReceivedMessages
 * @param {number} checkReceivedMessagesCount
 * @return {Promise<boolean>}
 */
async function checkDKGSessionPhase(rpcClients, quorumHash, phase, expectedMemberCount, checkReceivedMessages, checkReceivedMessagesCount) {
  let allOk = true;
  let memberCount = 0;

  for (let mnClient of rpcClients) {
    const { result: dkgStatus } = await mnClient.quorum("dkgstatus");
    const { session } = dkgStatus;

    if (!session.hasOwnProperty("llmq_test")) {
      continue;
    }

    memberCount +=1;
    const llmqSession = session.llmq_test;

    const quorumHashDoesntMatch = llmqSession.quorumHash !== quorumHash;
    const sessionPhaseDoesntMatch = !llmqSession.hasOwnProperty("phase") || llmqSession.phase !== phase;
    const receivedMessagesDoNotMatch = checkReceivedMessages != null && llmqSession[checkReceivedMessages] < checkReceivedMessagesCount;

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

module.exports = waitForQuorumPhase;
