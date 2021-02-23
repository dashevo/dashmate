const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupResetCommand extends GroupBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {isSystemConfig} isSystemConfig
   * @param {resetNodeTask} resetNodeTask
   * @param {Config[]} configGroup
   * @param {configureCoreTask} configureCoreTask
   * @param {configureTenderdashTask} configureTenderdashTask
   * @param {initializePlatformTask} initializePlatformTask
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      verbose: isVerbose,
      hard: isHardReset,
      'platform-only': isPlatformOnlyReset,
    },
    isSystemConfig,
    resetNodeTask,
    configGroup,
    configureCoreTask,
    configureTenderdashTask,
    initializePlatformTask,
  ) {
    const groupName = configGroup[0].get('group');

    if (isHardReset && !isSystemConfig(groupName)) {
      throw new Error(`Cannot hard reset non-system config group "${configGroup[0].get('group')}"`);
    }

    const tasks = new Listr(
      [
        {
          title: `Reset ${groupName} nodes`,
          task: () => new Listr(configGroup.map((config) => ({
            title: `Reset ${config.getName()} node`,
            task: (ctx) => {
              ctx.skipPlatformInitialization = true;

              return resetNodeTask(config);
            },
          }))),
        },
        {
          enabled: (ctx) => !ctx.isHardReset && !ctx.isPlatformOnlyReset,
          title: 'Configure Core nodes',
          task: () => configureCoreTask(configGroup),
        },
        {
          enabled: (ctx) => !ctx.isHardReset,
          title: 'Configure Tenderdash nodes',
          task: () => configureTenderdashTask(configGroup),
        },
        {
          enabled: (ctx) => !ctx.isHardReset,
          title: 'Initialize Platform',
          task: () => initializePlatformTask(configGroup),
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
      await tasks.run({
        isHardReset,
        isPlatformOnlyReset,
      });
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
