const { Listr } = require('listr2');

/**
 * @param {initializeTenderdashNode} initializeTenderdashNode
 * @param {Docker} docker
 * @return tenderdashInitTask
 */
function tenderdashInitTaskFactory(
  initializeTenderdashNode,
  docker,
) {
  /**
   * @param {Config} config
   * @return {Listr}
   */
  function tenderdashInitTask(
    config,
  ) {
    return new Listr([
      {
        title: 'Validate keys and volumes',
        task: async () => {
          const isValidatorKeyEmpty = Object.keys(config.get('platform.drive.tenderdash.validatorKey')).length === 0;
          const isNodeKeyEmpty = Object.keys(config.get('platform.drive.tenderdash.nodeKey')).length === 0;
          const isGenesisEmpty = Object.keys(config.get('platform.drive.tenderdash.genesis')).length === 0;

          const { Volumes: existingVolumes } = await docker.listVolumes();
          const { COMPOSE_PROJECT_NAME: composeProjectName } = config.toEnvs();
          const isDataVolumeMissing = !existingVolumes.find((v) => v.Name === `${composeProjectName}_drive_tenderdash`);

          if (isValidatorKeyEmpty || isNodeKeyEmpty || isNodeKeyEmpty || isDataVolumeMissing) {
            const [validatorKey, nodeKey, genesis] = await initializeTenderdashNode(config);

            if (isValidatorKeyEmpty) {
              config.set('platform.drive.tenderdash.validatorKey', validatorKey);
            }

            if (isNodeKeyEmpty) {
              config.set('platform.drive.tenderdash.nodeKey', nodeKey);
            }

            if (isGenesisEmpty) {
              if (config.network === 'local') {
                genesis.initial_core_chain_locked_height = 1000;
              }

              config.set('platform.drive.tenderdash.genesis', genesis);
            }
          }
        },
      },
    ]);
  }

  return tenderdashInitTask;
}

module.exports = tenderdashInitTaskFactory;
