const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupResetCommand extends GroupBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {resetNodeTask} resetNodeTask
   * @param {Config[]} configGroup
   *
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
    stopNodeTask,
    configGroup,
  ) {
    if (isHardReset && !isSystemConfig(configGroup[0].get('group'))) {
      throw new Error(`Cannot hard reset non-system config group "${configGroup[0].get('group')}"`);
    }

    const tasks = new Listr(
      [
        {
          title: `Reset ${configGroup[0].get('group')} nodes`,
          task: () => new Listr(configGroup.map((config, index) => ({
            title: `Reset ${config.getName()} node`,
            task: (ctx) => {
              ctx.skipPlatformInitialization = index !== configGroup.length - 1;

              return resetNodeTask(config);
            },
          }))),
        },
        {
          title: `Stop ${configGroup[0].get('group')} nodes`,
          task: () => new Listr(configGroup.map((config) => ({
            title: `Stop ${config.getName()} node`,
            task: () => stopNodeTask(config),
          }))),
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
