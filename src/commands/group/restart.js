const { Listr } = require('listr2');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupReStartCommand extends GroupBaseCommand {
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
    restartNodeTask,
    configGroup,
  ) {
    const tasks = new Listr(
      [
        {
          title: 'Restart nodes',
          task: () => {
            const restartNodeTasks = [];

            for (let i = 1; i < configGroup.length; ++i) {
              restartNodeTasks.push({
                title: `Restarting node #${i}`,
                task: async () => restartNodeTask(
                  configGroup[i].toEnvs(),
                  {
                    driveImageBuildPath,
                    dapiImageBuildPath,
                    isVerbose,
                  },
                ),
              });
            }

            return new Listr(restartNodeTasks);
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

GroupReStartCommand.description = 'Stop restart';

GroupReStartCommand.flags = {
  ...GroupBaseCommand.flags,
};

module.exports = GroupReStartCommand;
