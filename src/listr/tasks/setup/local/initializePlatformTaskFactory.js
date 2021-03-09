const { Listr } = require('listr2');

const baseConfig = require('../../../../../configs/system/base');
const isSeedNode = require('../../../../util/isSeedNode');
const getSeedNodeConfig = require('../../../../util/getSeedNodeConfig');

/**
 *
 * @param {startNodeTask} startNodeTask
 * @param {initTask} initTask
 * @param {activateSporksTask} activateSporksTask
 * @param {waitForTenderdashTask} waitForTenderdashTask
 * @param {DockerCompose} dockerCompose
 * @return {initializePlatformTask}
 */
function initializePlatformTaskFactory(
  startNodeTask,
  initTask,
  activateSporksTask,
  waitForTenderdashTask,
  dockerCompose,
) {
  /**
   * @typedef initializePlatformTask
   * @param {Config[]} configGroup
   * @return {Listr}
   */
  function initializePlatformTask(configGroup) {
    return new Listr([
      {
        task: () => {
          // to activate sporks faster, set miner interval to 2s
          const seedNodeConfig = getSeedNodeConfig(configGroup);
          seedNodeConfig.set('core.miner.interval', '10s');
        },
      },
      {
        title: 'Starting nodes',
        task: async (ctx) => {
          const startNodeTasks = configGroup.map((config) => ({
            title: `Starting ${config.getName()} node`,
            task: () => startNodeTask(
              config,
              {
                driveImageBuildPath: ctx.driveImageBuildPath,
                dapiImageBuildPath: ctx.dapiImageBuildPath,
                // run miner only at seed node
                isMinerEnabled: isSeedNode(config),
              },
            ),
          }));

          return new Listr(startNodeTasks);
        },
      },
      {
        title: 'Wait for tenderdash to start',
        task: () => waitForTenderdashTask(configGroup[configGroup.length - 2]),
      },
      {
        title: 'Activate sporks',
        task: () => activateSporksTask(configGroup),
      },
      {
        task: () => initTask(configGroup[0]),
      },
      {
        task: () => {
          // set platform data contracts
          const [initializedConfig, ...otherConfigs] = configGroup;

          otherConfigs
            .filter((config) => !isSeedNode(config))
            .forEach((config) => {
              config.set('platform.dpns', initializedConfig.get('platform.dpns'));
              config.set('platform.dashpay', initializedConfig.get('platform.dashpay'));
            });

          // set miner interval to default value
          const seedNodeConfig = getSeedNodeConfig(configGroup);
          seedNodeConfig.set('core.miner.interval', baseConfig.core.miner.interval);
        },
      },
      {
        title: 'Stopping nodes',
        task: async () => {
          // So we stop the miner first, as there's a chance that MNs will get banned
          // if the miner is still running when stopping them
          const stopNodeTasks = configGroup.reverse().map((config) => ({
            title: `Stop ${config.getName()} node`,
            task: () => dockerCompose.stop(config.toEnvs()),
          }));

          return new Listr(stopNodeTasks);
        },
      },
    ]);
  }

  return initializePlatformTask;
}

module.exports = initializePlatformTaskFactory;
