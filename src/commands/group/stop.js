const { Listr } = require('listr2');
const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class GroupStartCommand extends GroupBaseCommand {
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

GroupStartCommand.description = 'Stop group';

GroupStartCommand.flags = {
  ...GroupBaseCommand.flags,
};

module.exports = GroupStartCommand;
