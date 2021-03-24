const wait = require('../../util/wait');

/**
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @return {Promise<*>}
 */
async function mineQuorum(regtestNetwork) {
  const expectedMembers = 3;
  const expectedContributions = 3;
  const expectedCommitments = 3;
  const expectedConnections = 3;
  const expectedJustifications = 3;
  const expectedComplaints = 3;
  const mninfos = [];

  const rpcClient = regtestNetwork.getCoreServices()[0].getRpcClient();
  const rpcClients = regtestNetwork.getAllRpcClients();

  console.log(`Mining quorum:

    expectedMembers=${expectedMembers},
    expectedConnections=${expectedConnections},
    expectedContributions=${expectedContributions},
    expectedComplaints=${expectedComplaints},
    expectedJustifications=${expectedJustifications},
    expectedCommitments=${expectedCommitments}`
  );

  const nodes = []; // Get all RPC clients

  const { result: quorums } = regtestNetwork.quorumList();

  const { result: bestBlockHeight } = await rpcClient.getBlockCount();
  // move forward to next DKG
  const blocksUntilNextDKG = 24 - (bestBlockHeight  % 24);
  if (blocksUntilNextDKG !== 0) {
    await regtestNetwork.bumpMocktime(1);
    await regtestNetwork.generate(blocksUntilNextDKG);
  }

  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  const { result: quorumHash } = await rpcClient.getBestBlockHash();

  console.log("Waiting for phase 1 (init)");

  await regtestNetwork.waitForQuorumPhase(quorumHash, 1, expectedMembers);
  await waitForQuorumConnections(expectedConnections, nodes);

  const { result: sporks } = await rpcClient.spork('show');
  const isSpork21Active = sporks['SPORK_21_QUORUM_ALL_CONNECTED'] === 0;

  if (isSpork21Active) {
    await waitForMasternodeProbes(mninfos);
  }

  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(2);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log("Waiting for phase 2 (contribute)")
  await regtestNetwork.waitForQuorumPhase(quorumHash, 2, expectedMembers);
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(2);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log("Waiting for phase 3 (complain)")
  await regtestNetwork.waitForQuorumPhase(quorumHash, 3, expectedMembers, "receivedComplaints", expectedComplaints)
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(2);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log("Waiting for phase 4 (justify)")
  await regtestNetwork.waitForQuorumPhase(quorumHash, 4, expectedMembers, "receivedJustifications", expectedJustifications);
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(2);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log("Waiting for phase 5 (commit)")
  await regtestNetwork.waitForQuorumPhase(quorumHash, 5, expectedMembers, "receivedPrematureCommitments", expectedCommitments);
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(2);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log("Waiting for phase 6 (mining)");
  await regtestNetwork.waitForQuorumPhase(quorumHash, 6, expectedMembers);

  console.log("Waiting final commitment");
  await regtestNetwork.waitForQuorumCommitments(quorumHash);

  console.log("Mining final commitment")
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(1);

  let newQuorumList = await regtestNetwork.quorumList();

  // This should be deep equal to the quorums at the beginning
  while (newQuorumList) {
    await wait(2000);
    await regtestNetwork.bumpMocktime(1);
    await regtestNetwork.generate(1);
    await regtestNetwork.waitForAllNodesToHaveTheSameHeight();
    newQuorumList = await regtestNetwork.quorumList();
  }

  const quorumList = await regtestNetwork.quorumList(1);
  const newQuorumHash = quorumList["llmq_test"][0];
  const quorum_info = regtestNetwork.quorumInfo(100, newQuorumHash);

  // Mine 8 (SIGN_HEIGHT_OFFSET) more blocks to make sure that the new quorum gets eligable for signing sessions
  await regtestNetwork.generate(8);

  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  // console.log("New quorum: height=%d, quorumHash=%s, minedBlock=%s" % (quorum_info["height"], new_quorum, quorum_info["minedBlock"]));

  return newQuorumHash;
}

module.exports = mineQuorum;
