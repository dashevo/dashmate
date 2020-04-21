const { PrivateKey } = require('@dashevo/dashcore-lib');

/**
 * Generates blocks in regtest mode
 *
 * @param {RpcClient} coreClient
 * @param {number} blocks
 * @returns {Promise<void>}
 */
async function generateLocalBlocks(coreClient, blocks) {
  // generate random address
  const network = 'testnet';
  const address = new PrivateKey(undefined, network).toAddress(network).toString();

  for (let i = 0; i < blocks; i++) {
    await coreClient.generateToAddress(1, address);
  }
}

module.exports = generateLocalBlocks;
