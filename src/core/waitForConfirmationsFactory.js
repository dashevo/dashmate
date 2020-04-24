const wait = require('../util/wait');

/**
 * Wait for confirmations to be reached
 *
 * @param {Object} logger
 * @property {function} log
 * @property {function} info
 * @property {function} warn
 * @property {function} error
 * @param {RpcClient} coreClient
 * @returns {waitForConfirmationsFactory}
 */
function waitForConfirmationsFactory(logger, coreClient) {
  /**
   * @typedef waitForConfirmationsFactory
   * @param {string} preset
   * @param {string} txHash
   * @param {number} confirmations
   * @returns {Promise<void>}
   */
  async function waitForConfirmations(preset, txHash, confirmations) {
    if (preset === 'local') {
      await coreClient.generate(confirmations);
    } else {
      let confirmationsReached = 0;

      do {
        await wait(20000);
        ({ result: { confirmationsReached } } = await coreClient.getrawtransaction(txHash, 1));

        if (confirmations === undefined) {
          confirmationsReached = 0;
        }

        logger.info(`Confirmations: ${confirmationsReached}`);
      } while (confirmationsReached < confirmations);
    }
  }

  return waitForConfirmations;
}

module.exports = waitForConfirmationsFactory;
