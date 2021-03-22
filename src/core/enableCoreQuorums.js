const { PrivateKey } = require('@dashevo/dashcore-lib');
const wait = require('../util/wait');

/**
 * Wait Core to set quorum
 *
 * @typedef {enableCoreQuorums}
 * @param {RpcClient} rpcClient
 * @param {string} network
 * @return {Promise<void>}
 */
async function enableCoreQuorums(rpcClient, network) {
  const privateKey = new PrivateKey();
  const address = privateKey.toAddress(network).toString();

  let hasQuorums = false;

  do {
    const { result: quorums } = await rpcClient.quorum('list');

    if (quorums) {
      for (const quorum of Object.values(quorums)) {
        if (quorum.length > 1) {
          hasQuorums = true;
        }
      }
    }

    if (!hasQuorums) {
      await rpcClient.generateToAddress(1, address, 10000000);
      await wait(5000);
    }
  } while (!hasQuorums);
}

let mocktime = 0;

/**
 *
 * @param {RpcClient} rpcClient
 * @return {Promise<*>}
 */
async function mineQuorum(rpcClient) {
  const expectedMembers = 3;
  const expectedContributions = 3;
  const expectedCommitments = 3;
  const expectedConnections = 3;
  const expectedJustifications = 3;
  const expectedComplaints = 3;
  const mninfos = [];

  const generate = createGenerate(rpcClient);

  console.log(`Mining quorum:
    expectedMembers=${expectedMembers},
    expectedConnections=${expectedConnections},
    expectedContributions=${expectedContributions},
    expectedComplaints=${expectedComplaints},
    expectedJustifications=${expectedJustifications},
    expectedCommitments=${expectedCommitments}`
  );

  const nodes = []; // Get all RPC clients
  //nodes = [self.nodes[0]] + [mn.node for mn in mninfos]

  const { result: quorums } = await rpcClient.quorum('list');

  const { result: bestBlockHeight } = await rpcClient.getBlockCount();
  // move forward to next DKG
  const blocksUntilNextDKG = 24 - (bestBlockHeight  % 24);
  if (blocksUntilNextDKG !== 0) {
    await bumpMockTimeForNodes(1, nodes);
    await generate(blocksUntilNextDKG);
  }

  await waitForAllNodesToSync(nodes);

  const { result: bestBlockHash } = await rpcClient.getBestBlockHash();

  console.log("Waiting for phase 1 (init)");

  await waitForQuorumPhase(q, 1, expectedMembers, null, 0, mninfos)
  await waitForQuorumConnections(expectedConnections, nodes, wait_proc=lambda: self.bump_mocktime(1, nodes=nodes))

  const { result: sporks } = await rpcClient.spork('show');
  const isSpork21Active = sporks['SPORK_21_QUORUM_ALL_CONNECTED'] === 0;

  if (isSpork21Active) {
    await waitForMasternodeProbes(mninfos, wait_proc=lambda: self.bump_mocktime(1, nodes=nodes));
  }

  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSync(nodes);

  console.log("Waiting for phase 2 (contribute)")
  await waitForQuorumPhase(q, 2, expectedMembers, "receivedContributions", expectedContributions, mninfos)
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSync(nodes);

  console.log("Waiting for phase 3 (complain)")
  await waitForQuorumPhase(q, 3, expectedMembers, "receivedComplaints", expectedComplaints, mninfos)
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSync(nodes);

  console.log("Waiting for phase 4 (justify)")
  await waitForQuorumPhase(q, 4, expectedMembers, "receivedJustifications", expectedJustifications, mninfos);
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSync(nodes);

  console.log("Waiting for phase 5 (commit)")
  await waitForQuorumPhase(q, 5, expectedMembers, "receivedPrematureCommitments", expectedCommitments, mninfos);
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSync(nodes);

  console.log("Waiting for phase 6 (mining)");
  await waitForQuorumPhase(q, 6, expectedMembers, null, 0, mninfos);

  console.log("Waiting final commitment");
  await waitForQuorumCommitments(q, nodes);

  console.log("Mining final commitment")
  await bumpMockTimeForNodes(1, nodes);
  self.nodes[0].generate(1)

  let newQuorumList;
  newQuorumList = await rpcClient.quorum('list');

  while (newQuorumList) {
    await wait(2000);
    await bumpMockTimeForNodes(1, nodes);
    await generate(1);
    await waitForAllNodesToSync(nodes);
    newQuorumList = await rpcClient.quorum('list');
  }

  const new_quorum = await rpcClient.quorum("list", 1)["llmq_test"][0];
  const quorum_info = await rpcClient.quorum("info", 100, new_quorum);

  // Mine 8 (SIGN_HEIGHT_OFFSET) more blocks to make sure that the new quorum gets eligable for signing sessions
  await generate(8);

  await waitForAllNodesToSync(nodes);

  console.log("New quorum: height=%d, quorumHash=%s, minedBlock=%s" % (quorum_info["height"], new_quorum, quorum_info["minedBlock"]));

  return new_quorum;
}

function createGenerate(rpcClient) {
  return async function generate(blocksCount) {
    await rpcClient.generate(blocksCount);
  }
}

/**
 *
 * @param {number} time
 * @param {RpcClient[]} rpcClients
 * @return {Promise<void>}
 */
async function bumpMockTimeForNodes(time, rpcClients) {
  mocktime += time;
  for (const rpcClient of rpcClients) {
    await bumpMockTime(rpcClient, mocktime);
  }
}

/**
 *
 * @param {RpcClient} rpcClient
 * @param {number} mockTime
 * @return {Promise<void>}
 */
async function bumpMockTime(rpcClient, mockTime) {
  await rpcClient.setMockTime(mockTime);
}

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

async function waitForAllNodesToSync(rpcClients) {

}

async function waitForQuorumCommitmnets() {

}

async function waitForMasternodeProbes() {

}

async function waitForQuorumConnections() {

}

module.exports = enableCoreQuorums;
