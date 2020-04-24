const wait = require('../util/wait');

/**
 * Wait for Dash core to start rpc server
 *
 * @param {Object} logger
 * @property {function} log
 * @property {function} info
 * @property {function} warn
 * @property {function} error
 * @param {RpcClient} coreClient
 * @return waitForCoreStart
 */
function waitForCoreStartFactory(logger, coreClient) {
  /**
   * @typedef waitForCoreStart
   * @returns {Promise<void>}
   */
  async function waitForCoreStart() {
    let retires = 0;
    let isReady = false;
    const maxRetries = 120; // ~2 minutes

    logger.info('Waiting for Dash core to start');

    do {
      try {
        // just any random request
        await coreClient.ping();

        isReady = true;
      } catch (e) {
        // just wait 1 second before next try
        await wait(1000);
        ++retires;
      }
    } while (!isReady && retires < maxRetries);

    if (!isReady) {
      throw new Error('Could not connect to to Dash core RPC');
    }
  }

  return waitForCoreStart;
}

module.exports = waitForCoreStartFactory;
