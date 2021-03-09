const { Listr } = require('listr2');
const wait = require('../../../util/wait');

/**
 *
 * @param {createTenderdashRpcClient} createTenderdashRpcClient
 * @return {waitForTenderdashTask}
 */
function waitForTenderdashTaskFactory(
  createTenderdashRpcClient,
) {
  /**
   * @typedef waitForTenderdashTask
   * @param {Config} config
   * @return {Promise<void>}
   */
  async function waitForTenderdashTask(config) {
    return new Listr([
      {
        title: 'Wating for tenderdash',
        task: async () => {
          const port = config.get('platform.drive.tenderdash.rpc.port');

          const tenderdashRpcClient = createTenderdashRpcClient({ port });

          let success = false;
          do {
            const response = await tenderdashRpcClient.request('status', {}).catch(() => {});

            if (response) {
              success = !response.error;
            }

            if (!success) {
              await wait(2000);
            }
          } while (!success);
        },
      },
    ]);
  }

  return waitForTenderdashTask;
}

module.exports = waitForTenderdashTaskFactory;
