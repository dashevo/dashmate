const wait = require('./wait');
const generateLocalBlocks = require('./generateLocalBlocks');

/**
 * Wait for confirmations to be reached
 *
 * @param {RpcClient} coreClient
 * @param {string} preset
 * @param {string} txHash
 * @param {number} confirmations
 * @returns {Promise<void>}
 */
async function waitForConfirmations(coreClient, preset, txHash, confirmations) {
  if (preset === 'local') {
    await generateLocalBlocks(coreClient, confirmations);
  } else {
    let confirmationsReached = 0;

    do {
      await wait(20000);
      ({ result: { confirmationsReached } } = await coreClient.getrawtransaction(txHash, 1));

      if (confirmations === undefined) {
        confirmationsReached = 0;
      }

      console.info(`Confirmations: ${confirmationsReached}`);
    } while (confirmationsReached < confirmations);
  }
}

module.exports = waitForConfirmations;
