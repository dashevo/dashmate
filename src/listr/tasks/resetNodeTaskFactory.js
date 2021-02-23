const { Listr } = require('listr2');

/**
 * @param {DockerCompose} dockerCompose
 * @param {Docker} docker
 * @param {tenderdashInitTask} tenderdashInitTask
 * @param {initTask} initTask
 * @param {startNodeTask} startNodeTask
 * @param {registerMasternodeTask} registerMasternodeTask
 * @param {generateToAddressTask} generateToAddressTask
 * @param {systemConfigs} systemConfigs
 * @return {resetNodeTask}
 */
function resetNodeTaskFactory(
  dockerCompose,
  docker,
  tenderdashInitTask,
  initTask,
  startNodeTask,
  registerMasternodeTask,
  generateToAddressTask,
  systemConfigs,
) {
  /**
   * @typedef {resetNodeTask}
   * @param {Config} config
   */
  function resetNodeTask(config) {
    const isPlatformServicesEnabled = config.get('compose.file').includes('docker-compose.platform.yml');

    return new Listr([
      {
        task: async () => {
          if (await dockerCompose.isServiceRunning(config.toEnvs())) {
            throw new Error('Running services detected. Please ensure all services are stopped for this config before starting');
          }
        },
      },
      {
        title: 'Remove all services and associated data',
        enabled: (ctx) => !ctx.isPlatformOnlyReset,
        task: async () => dockerCompose.down(config.toEnvs()),
      },
      {
        title: 'Remove platform services and associated data',
        enabled: (ctx) => ctx.isPlatformOnlyReset && isPlatformServicesEnabled,
        task: async () => {
          // Remove containers
          const coreContainerNames = ['core', 'sentinel'];
          const containerNames = await dockerCompose
            .getContainersList(config.toEnvs(), undefined, true);
          const platformContainerNames = containerNames
            .filter((containerName) => !coreContainerNames.includes(containerName));

          await dockerCompose.rm(config.toEnvs(), platformContainerNames);

          // Remove volumes
          const coreVolumeNames = ['core_data'];
          const { COMPOSE_PROJECT_NAME: composeProjectName } = config.toEnvs();

          const projectvolumeNames = await dockerCompose.getVolumeNames(config.toEnvs());

          await projectvolumeNames
            .filter((volumeName) => !coreVolumeNames.includes(volumeName))
            .map((volumeName) => `${composeProjectName}_${volumeName}`)
            .map(async (volumeName) => docker.getVolume(volumeName).remove());
        },
      },
      {
        title: `Reset config ${config.getName()}`,
        enabled: (ctx) => ctx.isHardReset,
        task: (ctx) => {
          const name = config.get('group') || config.getName();

          if (ctx.isPlatformOnlyReset) {
            const { platform: systemPlatformConfig } = systemConfigs[name];
            config.set('platform', systemPlatformConfig);
          } else {
            config.setOptions(systemConfigs[name]);
          }
        },
      },
      {
        title: 'Initialize Tenderdash',
        enabled: (ctx) => (
          !ctx.isHardReset && !ctx.skipPlatformInitialization && isPlatformServicesEnabled
        ),
        task: () => tenderdashInitTask(config),
      },
      // {
      //   title: 'Reset private keys',
      //   enabled: (ctx) => !ctx.isHardReset && !ctx.isPlatformOnlyReset && config.get('network') === NETWORK_LOCAL,
      //   task: () => {
      //     config.set('core.masternode.operator.privateKey', null);
      //   },
      // },
      // {
      //   title: 'Register masternode',
      //   enabled: (ctx) => !ctx.isHardReset && !ctx.isPlatformOnlyReset && config.get('core.masternode.enable') && config.get('network') === NETWORK_LOCAL,
      //   task: (ctx) => new Listr([
      //     {
      //       title: 'Await Core to sync',
      //       enabled: () => config.get('group') !== null,
      //       task: async () => waitForCoreSync(ctx.coreService),
      //     },
      //     {
      //       title: `Generate ${amount} dash to local wallet`,
      //       task: () => generateToAddressTask(config, amount),
      //     },
      //     {
      //       title: 'Register masternode',
      //       task: () => registerMasternodeTask(config),
      //     },
      //     {
      //       // hidden task to clear values
      //       task: () => {
      //         ctx.address = null;
      //         ctx.privateKey = null;
      //         ctx.coreService = null;
      //       },
      //     },
      //   ]),
      // },
      // {
      //   title: 'Stopping node',
      //   enabled: (ctx) => !ctx.isHardReset,
      //   task: async (ctx) => ctx.coreService.stop(),
      // },
      // {
      //   // in case we don't need to register masternodes
      //   title: `Generate ${amount} dash to local wallet`,
      //   enabled: (ctx) => !ctx.isHardReset && config.get('network') === NETWORK_LOCAL,
      //   skip: (ctx) => !!ctx.fundingPrivateKeyString,
      //   task: () => generateToAddressTask(config, amount),
      // },
      // {
      //   title: 'Initialize platform',
      //   enabled: (ctx) => !ctx.isHardReset && config.get('network') === NETWORK_LOCAL && !ctx.skipPlatformInitialization,
      //   task: () => new Listr([
      //     {
      //       title: 'Starting node',
      //       task: (ctx) => startNodeTask(
      //         config,
      //         {
      //           driveImageBuildPath: ctx.driveImageBuildPath,
      //           dapiImageBuildPath: ctx.dapiImageBuildPath,
      //           isMinerEnabled: config.get('core.miner.enabled'),
      //         },
      //       ),
      //     },
      //     {
      //       title: 'Wait 20 seconds to ensure all services are running',
      //       task: async () => wait(20000),
      //     },
      //     {
      //       title: 'Create initial platform data',
      //       task: () => {
      //         config.set('platform.dpns.ownerId', null);
      //         config.set('platform.dpns.contract.id', null);
      //
      //         return initTask(config);
      //       },
      //     },
      //     {
      //       title: 'Stopping node',
      //       enabled: () => config.get('group') === null,
      //       task: async () => dockerCompose.stop(config.toEnvs()),
      //     },
      //   ]),
      // },
    ]);
  }

  return resetNodeTask;
}

module.exports = resetNodeTaskFactory;
