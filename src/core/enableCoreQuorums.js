const mineQuorum = require('../core/quorum/mineQuorum');

/**
 * Wait Core to set quorum
 *
 * @typedef {enableCoreQuorums}
 * @param {CoreRegtestNetwork} regtestNetwork
 * @return {Promise<void>}
 */
async function enableCoreQuorums(regtestNetwork) {
  await mineQuorum(regtestNetwork);
}

module.exports = enableCoreQuorums;
