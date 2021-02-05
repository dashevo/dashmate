const { Listr } = require('listr2');

const wait = require('../../../util/wait');

/**
 * @param {registerMasternodeTask} registerMasternodeTask
 * @param {generateToAddressTask} generateToAddressTask
 * @param {tenderdashInitTask} tenderdashInitTask
 * @param {initTask} initTask
 * @param {startNodeTask} startNodeTask
 * @param {ConfigFile} configFile
 * @param {writeServiceConfigs} writeServiceConfigs
 * @param {renderServiceTemplates} renderServiceTemplates
 * @param {DockerCompose} dockerCompose
 */
function setupLocalPresetTaskFactory(
  registerMasternodeTask,
  generateToAddressTask,
  tenderdashInitTask,
  initTask,
  startNodeTask,
  configFile,
  writeServiceConfigs,
  renderServiceTemplates,
  dockerCompose,
) {
  /**
   * @typedef {setupLocalPresetTask}
   *
   * @param
   * @param {Object} options
   * @param {boolean} options.updateImages
   *
   * @return {Listr}
   */
  function setupLocalPresetTask({ updateImages }) {
    const amount = 10000;

    return new Listr([
      {
        title: 'Update config',
        task: (ctx) => {
          configFile.setDefaultConfigName(ctx.preset);

          ctx.config = configFile.getDefaultConfig();

          const configFiles = renderServiceTemplates(ctx.config);
          writeServiceConfigs(ctx.config.getName(), configFiles);
        },
      },
      {
        title: `Generate ${amount} dash to local wallet`,
        task: (ctx) => generateToAddressTask(ctx.config, amount),
      },
      {
        title: 'Register masternode',
        task: (ctx) => registerMasternodeTask(ctx.config),
      },
      {
        title: 'Initialize Tenderdash',
        task: (ctx) => tenderdashInitTask(ctx.config),
      },
      {
        title: 'Start masternode',
        task: async (ctx) => startNodeTask(
          ctx.config,
          {
            driveImageBuildPath: ctx.driveImageBuildPath,
            dapiImageBuildPath: ctx.dapiImageBuildPath,
            updateImages,
            isMinerEnabled: true,
          },
        ),
      },
      {
        title: 'Wait 20 seconds to ensure all services are running',
        task: async () => {
          await wait(20000);
        },
      },
      {
        title: 'Initialize Platform',
        task: (ctx) => initTask(ctx.config),
      },
      {
        title: 'Stop node',
        task: async (ctx) => dockerCompose.stop(ctx.config.toEnvs()),
      },
    ]);
  }

  return setupLocalPresetTask;
}

module.exports = setupLocalPresetTaskFactory;
