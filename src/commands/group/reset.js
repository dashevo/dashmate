const { Listr } = require('listr2');
const { flags: flagTypes } = require('@oclif/command');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

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
    startNodeTask,
    configFile,
    configGroup,
    writeServiceConfigs,
    renderServiceTemplates,
  ) {
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
                title: `Removing services #${i}`,
                task: () => resetSystemConfig(
                  configFile,
                  configGroup[i].getName(),
                  isPlatformOnlyReset,
                ),
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
          title: 'Interconnect Tenderdash nodes',
          task: (ctx) => {
            let genesisTime;
            const randomChainIdPart = Math.floor(Math.random() * 60) + 1;
            const chainId = `dash_masternode_local_${randomChainIdPart}`;

            const validators = [];
            for (let i = 1; i < configGroup.length; i++) {
              const config = configGroup[i];

              const validatorKey = config.get('platform.drive.tenderdash.validatorKey');

              validators.push({
                address: validatorKey.address,
                pub_key: validatorKey.pub_key,
                power: '1',
                name: `node${i}`,
              });
            }

            for (let i = 1; i < configGroup.length; i++) {
              const config = configGroup[i];

              if (i === 0) {
                genesisTime = config.get('platform.drive.tenderdash.genesis.genesis_time');
              }

              config.set('platform.drive.tenderdash.genesis.genesis_time', genesisTime);
              config.set('platform.drive.tenderdash.genesis.chain_id', chainId);

              const p2pPeers = [];
              for (let n = 1; n < configGroup.length; n++) {
                if (n === i) {
                  continue;
                }

                const nodeId = config.get('platform.drive.tenderdash.nodeId');

                p2pPeers.push({
                  id: nodeId,
                  host: 'host.docker.internal',
                  port: 26656 + (n * 100),
                });
              }

              config.set('platform.drive.tenderdash.p2p.persistentPeers', p2pPeers);
              config.set('platform.drive.tenderdash.genesis.validators', validators);

              const configFiles = renderServiceTemplates(config);
              writeServiceConfigs(config.getName(), configFiles);
            }
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
