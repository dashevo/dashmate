const { Listr } = require('listr2');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupStartCommand extends GroupBaseCommand {
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
      'drive-image-build-path': driveImageBuildPath,
      'dapi-image-build-path': dapiImageBuildPath,
      verbose: isVerbose,
    },
    dockerCompose,
    startNodeTask,
    configGroup,
  ) {
    const tasks = new Listr(
      [
        {
          title: 'Start nodes',
          task: async () => {
            const startNodeTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              startNodeTasks.push({
                title: `Starting node #${i}`,
                task: () => startNodeTask(
                  configGroup[i],
                  {
                    driveImageBuildPath,
                    dapiImageBuildPath,
                  },
                ),
              });
            }

            return new Listr(startNodeTasks);
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

GroupStartCommand.description = 'Start group';

GroupStartCommand.flags = {
  ...GroupBaseCommand.flags,
};

module.exports = GroupStartCommand;
