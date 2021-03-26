const isEqual = require('lodash.isequal');
const wait = require('../../util/wait');

/**
 * Ensures through all steps that a new quorum was successfully created and is ready to perform signatures
 *
 * @param {CoreRegtestNetwork} regtestNetwork
 * @param {string} quorumType
 * @return {Promise<string>} - newly formed quorum hash
 */
async function mineQuorum(regtestNetwork, quorumType) {
  // Those are default values for the quorum size 3 with all nodes behaving correctly
  const expectedMembers = 3;
  const expectedCommitments = 3;
  const expectedConnections = 2;

  const expectedContributions = 3;
  const expectedJustifications = 0;
  const expectedComplaints = 0;

  const rpcClient = regtestNetwork.getCoreServices()[0].getRpcClient();

  // Waiting up to 5 minutes to all nodes to catch up
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight(60 * 5 * 1000);

  const { result: initialQuorumList } = await rpcClient.quorum("list");
  const { result: bestBlockHeight } = await rpcClient.getBlockCount();
  const { result: bestBlockHash } = await rpcClient.getBestBlockHash();
  const { result: bestBlock } = await rpcClient.getBlock(bestBlockHash);

  await regtestNetwork.setMockTime(bestBlock.time);

  // move forward to next DKG
  const blocksUntilNextDKG = 24 - (bestBlockHeight % 24);
  if (blocksUntilNextDKG !== 0) {
    await regtestNetwork.bumpMocktime(1);
    await regtestNetwork.generate(blocksUntilNextDKG);
  }

  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  const { result: quorumHash } = await rpcClient.getBestBlockHash();

  console.log("Waiting for phase 1 (init)");

  await regtestNetwork.waitForQuorumPhase(quorumHash, 1, expectedMembers);
  await regtestNetwork.waitForQuorumConnections(expectedConnections);

  const { result: sporks } = await rpcClient.spork('show');
  const isSpork21Active = sporks['SPORK_21_QUORUM_ALL_CONNECTED'] === 0;

  if (isSpork21Active) {
    await regtestNetwork.waitForMasternodeProbes();
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

  console.log("Mining final commitment");
  await regtestNetwork.bumpMocktime(1);
  await regtestNetwork.generate(1);

  let { result: newQuorumList } = await rpcClient.quorum("list");

  console.log("Waiting for the new quorum to appear on the quorum list");
  while (isEqual(initialQuorumList, newQuorumList)) {
    await wait(2000);
    await regtestNetwork.bumpMocktime(1);
    await regtestNetwork.generate(1);
    await regtestNetwork.waitForAllNodesToHaveTheSameHeight();
    ({ result: newQuorumList } = await rpcClient.quorum("list"));
  }

  const { result: quorumList } = await rpcClient.quorum("list", 1);
  const newQuorumHash = quorumList["llmq_test"][0];
  const { result: quorumInfo } = await rpcClient.quorum('info', 100, newQuorumHash)

  console.log("Ensuring that the new quorum is eligible for signing sessions");
  // Mine 8 (SIGN_HEIGHT_OFFSET) more blocks to make sure that the new quorum gets eligible for signing sessions
  await regtestNetwork.generate(8);
  await regtestNetwork.waitForAllNodesToHaveTheSameHeight();

  console.log(`New quorum mined. Quorum height: ${quorumInfo.height}, quorum hash: ${newQuorumHash}, mined in block: ${quorumInfo.minedBlock}`);

  return newQuorumHash;
}

module.exports = mineQuorum;
