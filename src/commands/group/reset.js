const { Listr } = require('listr2');
const { WritableStream } = require('memory-streams');
const { flags: flagTypes } = require('@oclif/command');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const wait = require('../../util/wait');

class GroupResetCommand extends GroupBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {Docker} docker
   * @param {resetSystemConfig} resetSystemConfig
   * @param {tenderdashInitTask} tenderdashInitTask
   * @param {initTask} initTask
   * @param {registerMasternodeTask} registerMasternodeTask
   * @param {generateToAddressTask} generateToAddressTask
   * @param {Config[]} configGroup
   * @param {systemConfigs} systemConfigs
   * @param {startCore} startCore
   * @param {waitForCoreSync} waitForCoreSync
   * @param {generateBlocks} generateBlocks
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      verbose: isVerbose,
      hard: isHardReset,
      'platform-only': isPlatformOnlyReset,
    },
    dockerCompose,
    docker,
    resetSystemConfig,
    tenderdashInitTask,
    initTask,
    startNodeTask,
    registerMasternodeTask,
    generateToAddressTask,
    configGroup,
    systemConfigs,
    startCore,
    waitForCoreSync,
    generateBlocks,
  ) {
    const amount = 10000;

    const tasks = new Listr(
      [
        {
          title: 'Stop nodes',
          task: () => {
            const stopNodeTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              stopNodeTasks.push({
                title: `Stopping node #${i}`,
                task: async () => dockerCompose.stop(configGroup[i].toEnvs()),
              });
            }

            return new Listr(stopNodeTasks);
          },
        },
        {
          title: 'Remove all services and associated data',
          enabled: () => !isPlatformOnlyReset,
          task: async () => {
            const removeNodeTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              removeNodeTasks.push({
                title: `Removing services #${i}`,
                task: async () => dockerCompose.down(configGroup[i].toEnvs()),
              });
            }

            return new Listr(removeNodeTasks);
          },
        },
        {
          title: 'Remove platform services and associated data',
          enabled: () => isPlatformOnlyReset,
          task: async () => {
            const removeNodeTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              removeNodeTasks.push({
                title: `Removing services #${i}`,
                task: async () => {
                  const config = configGroup[i];

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
              });
            }

            return new Listr(removeNodeTasks);
          },
        },
        {
          title: `Reset config ${configGroup[0].getName()}`,
          enabled: () => isHardReset,
          task: () => {
            const resetSystemConfigTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              resetSystemConfigTasks.push({
                title: `Reset config #${i}`,
                task: () => {
                  const name = configGroup[0].getName();

                  if (isPlatformOnlyReset) {
                    const { platform: systemPlatformConfig } = systemConfigs[name];
                    configGroup[i].set('platform', systemPlatformConfig);
                  } else {
                    configGroup[i].setOptions(systemConfigs[name]);
                  }
                },
              });
            }

            return new Listr(resetSystemConfigTasks);
          },
        },
        {
          title: 'Initialize Tenderdash',
          enabled: () => !isHardReset,
          task: () => {
            const initTenderDashTasks = [];

            for (let i = 1; i < configGroup.length - 1; ++i) {
              initTenderDashTasks.push({
                title: `Initialize Tenderdash #${i}`,
                task: () => tenderdashInitTask(configGroup[i]),
              });
            }

            return new Listr(initTenderDashTasks);
          },
        },
        {
          // hidden task to dynamically get
          // host.docker.internal ip address
          enabled: () => !isHardReset,
          task: async (ctx) => {
            const writableStream = new WritableStream();

            const [result] = await docker.run(
              'alpine',
              [],
              writableStream,
              {
                Entrypoint: ['sh', '-c', 'nslookup host.docker.internal'],
                HostConfig: {
                  AutoRemove: true,
                },
              },
            );

            const output = writableStream.toString();

            if (result.StatusCode !== 0) {
              throw new Error(`Can't get host.docker.internal IP address: ${output}`);
            }

            const ips = output.match(/((?:[0-9]{1,3}\.){3}[0-9]{1,3})/g);

            ctx.hostDockerInternalIp = ips[ips.length - 1];
          },
        },
        {
          title: 'Reset private keys',
          enabled: () => !isHardReset && !isPlatformOnlyReset,
          task: () => {
            const subTasks = [];

            for (let i = 1; i < configGroup.length - 1; i++) {
              subTasks.push({
                title: `Reset masternode #${i}`,
                task: () => {
                  configGroup[i].set('core.masternode.operator.privateKey', null);
                },
              });
            }

            return new Listr(subTasks);
          },
        },
        {
          title: 'Starting nodes',
          enabled: () => !isHardReset,
          task: async (ctx) => {
            const coreServices = {};

            for (let i = 1; i < configGroup.length; i++) {
              const config = configGroup[i];

              const coreService = await startCore(config, { wallet: true, addressIndex: true });
              coreServices[i] = coreService;

              // need to generate 1 block to connect nodes to each other
              if (i === 0) {
                await generateBlocks(
                  coreService,
                  1,
                  config.get('network'),
                );
              }
            }

            ctx.coreServices = coreServices;
          },
        },
        {
          title: 'Register masternode',
          enabled: () => !isHardReset && !isPlatformOnlyReset,
          task: async (ctx) => {
            const subTasks = [];

            for (let i = 1; i < configGroup.length - 1; i++) {
              const config = configGroup[i];

              subTasks.push({
                title: `Register masternode #${i}`,
                task: () => new Listr([
                  // hidden task to set coreService
                  {
                    task: () => {
                      ctx.coreService = ctx.coreServices[i];
                    },
                  },
                  {
                    title: 'Wait for sync',
                    task: async () => {
                      if (i > 0) {
                        await waitForCoreSync(ctx.coreService);
                      }
                    },
                  },
                  {
                    title: `Generate ${amount} dash to local wallet`,
                    task: () => generateToAddressTask(config, amount),
                  },
                  {
                    title: 'Register masternode',
                    task: () => registerMasternodeTask(config),
                  },
                  {
                    // hidden task to clear values
                    task: () => {
                      ctx.address = null;
                      ctx.privateKey = null;
                      ctx.coreService = null;
                    },
                  },
                ]),
              });
            }

            // eslint-disable-next-line consistent-return
            return new Listr(subTasks);
          },
        },
        {
          title: 'Stopping nodes',
          enabled: () => !isHardReset,
          task: async (ctx) => {
            for (const coreService of Object.values(ctx.coreServices)) {
              await coreService.stop();
            }
          },
        },
        {
          // in case we don't need to register masternodes
          title: `Generate ${amount} dash to local wallet`,
          enabled: () => !isHardReset,
          skip: (ctx) => !!ctx.fundingPrivateKeyString,
          task: () => generateToAddressTask(configGroup[1], amount),
        },
        {
          title: 'Starting nodes',
          enabled: () => !isHardReset,
          task: async (ctx) => {
            const startNodeTasks = [];

            for (let i = 1; i < configGroup.length; i++) {
              const config = configGroup[i];
              startNodeTasks.push({
                title: `Starting node #${i}`,
                task: () => startNodeTask(
                  config,
                  {
                    driveImageBuildPath: ctx.driveImageBuildPath,
                    dapiImageBuildPath: ctx.dapiImageBuildPath,
                    isMinerEnabled: i === configGroup.length - 1,
                  },
                ),
              });
            }

            return new Listr(startNodeTasks);
          },
        },
        {
          title: 'Wait 60 seconds to ensure all services are running',
          enabled: () => !isHardReset,
          task: async () => {
            await wait(60000);
          },
        },
        {
          title: 'Initialize Platform',
          enabled: () => !isHardReset,
          task: () => {
            for (let i = 1; i < configGroup.length; ++i) {
              configGroup[i].set('platform.dpns.ownerId', null);
              configGroup[i].set('platform.dpns.contract.id', null);
            }

            return initTask(configGroup[configGroup.length - 2]);
          },
        },
        {
          title: 'Stopping nodes',
          enabled: () => !isHardReset,
          task: async () => {
            const stopNodeTasks = [];

            for (let i = 1; i < configGroup.length; i++) {
              const config = configGroup[i];
              stopNodeTasks.push({
                title: `Stop node #${i}`,
                task: async () => {
                  await dockerCompose.stop(config.toEnvs());
                },
              });
            }

            return new Listr(stopNodeTasks);
          },
        },
      ],
      {
        renderer: isVerbose ? 'verbose' : 'default',
        rendererOptions: {
          clearOutput: false,
          collapse: false,
          showSubtasks: true,
        },
      },
    );

    try {
      await tasks.run();
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

GroupResetCommand.description = 'Reset group';

GroupResetCommand.flags = {
  ...GroupBaseCommand.flags,
  hard: flagTypes.boolean({ char: 'h', description: 'reset config as well as data', default: false }),
  'platform-only': flagTypes.boolean({ char: 'p', description: 'reset platform data only', default: false }),
};

module.exports = GroupResetCommand;
