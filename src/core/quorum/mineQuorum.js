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

  await waitForAllNodesToSyncBlocks(nodes);

  const { result: bestBlockHash } = await rpcClient.getBestBlockHash();

  console.log("Waiting for phase 1 (init)");

  await waitForQuorumPhase(q, 1, expectedMembers, null, 0, mninfos);
  await waitForQuorumConnections(expectedConnections, nodes);

  const { result: sporks } = await rpcClient.spork('show');
  const isSpork21Active = sporks['SPORK_21_QUORUM_ALL_CONNECTED'] === 0;

  if (isSpork21Active) {
    await waitForMasternodeProbes(mninfos);
  }

  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSyncBlocks(nodes);

  console.log("Waiting for phase 2 (contribute)")
  await waitForQuorumPhase(q, 2, expectedMembers, "receivedContributions", expectedContributions, mninfos)
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSyncBlocks(nodes);

  console.log("Waiting for phase 3 (complain)")
  await waitForQuorumPhase(q, 3, expectedMembers, "receivedComplaints", expectedComplaints, mninfos)
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSyncBlocks(nodes);

  console.log("Waiting for phase 4 (justify)")
  await waitForQuorumPhase(q, 4, expectedMembers, "receivedJustifications", expectedJustifications, mninfos);
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSyncBlocks(nodes);

  console.log("Waiting for phase 5 (commit)")
  await waitForQuorumPhase(q, 5, expectedMembers, "receivedPrematureCommitments", expectedCommitments, mninfos);
  await bumpMockTimeForNodes(1, nodes);
  await generate(2);
  await waitForAllNodesToSyncBlocks(nodes);

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
    await waitForAllNodesToSyncBlocks(nodes);
    newQuorumList = await rpcClient.quorum('list');
  }

  const new_quorum = await rpcClient.quorum("list", 1)["llmq_test"][0];
  const quorum_info = await rpcClient.quorum("info", 100, new_quorum);

  // Mine 8 (SIGN_HEIGHT_OFFSET) more blocks to make sure that the new quorum gets eligable for signing sessions
  await generate(8);

  await waitForAllNodesToSyncBlocks(nodes);

  console.log("New quorum: height=%d, quorumHash=%s, minedBlock=%s" % (quorum_info["height"], new_quorum, quorum_info["minedBlock"]));

  return new_quorum;
}

function createGenerate(rpcClient) {
  return async function generate(blocksCount) {
    await rpcClient.generate(blocksCount);
  }
}

module.exports = mineQuorum;
