const { Listr } = require('listr2');
const { WritableStream } = require('memory-streams');
const { flags: flagTypes } = require('@oclif/command');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const wait = require('../../util/wait');

class GroupStartCommand extends GroupBaseCommand {
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
    configFile,
    configGroup,
    systemConfigs,
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

            for (let i = 1; i < configGroup.length; ++i) {
              initTenderDashTasks.push({
                title: `Removing services #${i}`,
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

            const [ipAddress] = output.match(/((?:[0-9]{1,3}\.){3}[0-9]{1,3})/g);

            ctx.hostDockerInternalIp = ipAddress;
          },
        },
        {
          title: `Generate ${amount} dash to local wallet`,
          enabled: () => !isHardReset,
          task: () => {
            const subTasks = [];
            for (let i = 1; i < configGroup.length; ++i) {
              subTasks.push(
                {
                  title: `Generate ${amount} dash to node #${i}`,
                  task: () => generateToAddressTask(configGroup[i], amount),
                },
              );
            }

            return new Listr(subTasks);
          },
        },
        {
          title: 'Register masternode',
          enabled: () => !isHardReset && !isPlatformOnlyReset,
          task: () => {
            const subTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              subTasks.push({
                title: `Setup node #${i}`,
                task: () => new Listr([
                  {
                    title: 'Reset config',
                    task: () => {
                      configGroup[i].set('core.masternode.operator.privateKey', null);
                    },
                  },
                  {
                    title: 'Register masternode',
                    task: () => registerMasternodeTask(configGroup[i]),
                  },
                ]),
              });
            }

            return new Listr(subTasks);
          },
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
                    isMinerEnabled: true,
                  },
                ),
              });
            }

            return new Listr(startNodeTasks);
          },
        },
        {
          title: 'Wait 20 seconds to ensure all services are running',
          enabled: () => !isHardReset,
          task: async () => {
            await wait(20000);
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

            return initTask(configGroup[1]);
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

GroupStartCommand.description = 'Stop group';

GroupStartCommand.flags = {
  ...GroupBaseCommand.flags,
  hard: flagTypes.boolean({ char: 'h', description: 'reset config as well as data', default: false }),
  'platform-only': flagTypes.boolean({ char: 'p', description: 'reset platform data only', default: false }),
};

module.exports = GroupStartCommand;
