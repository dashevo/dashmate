const { Listr } = require('listr2');

/**
 * @param {DockerCompose} dockerCompose
 *
 * @return {stopNodeTask}
 */
function stopNodeTaskFactory(dockerCompose) {
  /**
   * Stop node
   * @typedef stopNodeTask
   * @param {Config} config
   *
   * @return {Listr}
   */
  function stopNodeTask(
    config,
    createRpcClient,
  ) {
    return new Listr([
      {
        title: 'Save mock time',
        enabled: () => config.getName().startsWith('local_'),
        task: async () => {
          const rpcClient = createRpcClient({
            port: config.get('core.rpc.port'),
            user: config.get('core.rpc.user'),
            pass: config.get('core.rpc.password'),
          });

          const { result: { mediantime } } = await rpcClient.getBlockchainInfo();

          config.set('core.miner.mediantime', mediantime);
        },
      },
      {
        title: `Stopping ${config.getName()} node`,
        task: async () => dockerCompose.stop(config.toEnvs()),
      },
    ]);
  }

  return stopNodeTask;
}

module.exports = stopNodeTaskFactory;
