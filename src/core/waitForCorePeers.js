const wait = require('../util/wait');

/**
 * Wait Core to connect to peers
 *
 * @typedef {waitForCorePeers}
 * @param {RpcClient} rpcClient
 * @return {Promise<void>}
 */
async function waitForCorePeers(rpcClient) {
  let hasPeers = false;

  do {
    const { result: peers } = await rpcClient.getPeerInfo();

    hasPeers = peers && peers.length > 2;

    if (!hasPeers) {
      await wait(10000);
    }
  } while (!hasPeers);
}

module.exports = waitForCorePeers;
