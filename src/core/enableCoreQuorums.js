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
 * @param {RpcClient} rpcClient
 * @return {Promise<number>}
 */
async function getBlockCount(rpcClient) {
  const { result } = rpcClient.getBlockCount;
  return result;
}

/**
 *
 * @param {RpcClient} rpcClient
 * @param {number} maxHeight
 * @param {number} timeout
 * @return {Promise<*>}
 */
async function waitForBlockHeight(rpcClient, maxHeight, timeout) {
  const { result } = await rpcClient.waitForBlockHeight(maxHeight, timeout);
  return result;
}

module.exports = enableCoreQuorums;
