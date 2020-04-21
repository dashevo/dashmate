const wait = require('./wait');

/**
 * Wait for Dash core to start rpc server
 *
 * @param {RpcClient} coreClient
 * @returns {Promise<void>}
 */
async function waitForCoreStart(coreClient) {
  let retires = 0;
  let isReady = false;
  const maxRetries = 120; // ~2 minutes

  console.info('Waiting for Dash core to start');

  do {
    try {
      // just any random request
      await coreClient.getBlockchainInfo();

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

module.exports = waitForCoreStart;
