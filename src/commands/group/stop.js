const { Listr } = require('listr2');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupStopCommand extends GroupBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {startNodeTask} startNodeTask
   * @param {Config[]} configGroup
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      verbose: isVerbose,
    },
    dockerCompose,
    startNodeTask,
    configGroup,
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

GroupStopCommand.description = 'Stop group';

GroupStopCommand.flags = {
  ...GroupBaseCommand.flags,
};

module.exports = GroupStopCommand;
