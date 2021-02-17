const GroupBaseCommand = require('../../oclif/command/GroupBaseCommand');

class GroupStatusCommand extends GroupBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {statusTask} statusTask
   * @param {Config[]} configGroup
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    statusTask,
    configGroup,
  ) {
    for (let i = 1; i < configGroup.length; ++i) {
      const config = configGroup[1];

      // eslint-disable-next-line no-console
      console.log(`Node #${i}`);

      await statusTask(config);
    }
  }
}

GroupStatusCommand.description = 'Show group status overview';

GroupStatusCommand.flags = {
  ...GroupBaseCommand.flags,
};

module.exports = GroupStatusCommand;
