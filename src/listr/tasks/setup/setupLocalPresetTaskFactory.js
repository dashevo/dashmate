const { Listr } = require('listr2');

const wait = require('../util/wait');


function setupLocalPresetTaskFactory() {
  /**
   * @typedef {setupLocalPresetTask}
   * @return {Listr}
   */
  function setupLocalPresetTask() {
    const amount = 10000;


    return new Listr([
      {
        title: 'Update config',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: () => {
          const configFiles = renderServiceTemplates(config);
          writeServiceConfigs(config.getName(), configFiles);
        },
      },
      {
        title: `Generate ${amount} dash to local wallet`,
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: () => generateToAddressTask(config, amount),
      },
      {
        title: 'Register masternode',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: () => registerMasternodeTask(config),
      },
      {
        title: 'Initialize Tenderdash',
        task: () => tenderdashInitTask(config),
      },
      {
        title: 'Start masternode',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: async (ctx) => startNodeTask(
          config,
          {
            driveImageBuildPath: ctx.driveImageBuildPath,
            dapiImageBuildPath: ctx.dapiImageBuildPath,
            isUpdate,
            isMinerEnabled: true,
          },
        ),
      },
      {
        title: 'Wait 20 seconds to ensure all services are running',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: async () => {
          await wait(20000);
        },
      },
      {
        title: 'Initialize Platform',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: () => initTask(config),
      },
      {
        title: 'Stop node',
        enabled: (ctx) => ctx.preset === PRESET_LOCAL,
        task: async () => dockerCompose.stop(config.toEnvs()),
      },
    ]);
  }

  return setupLocalPresetTask;
}

module.exports = setupLocalPresetTaskFactory;
