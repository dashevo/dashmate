const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');

class StatusCommand extends ConfigBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {statusTask} statusTask
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    statusTask,
    config,
  ) {
    await statusTask(config);
  }
}

StatusCommand.description = 'Show status overview';

StatusCommand.flags = {
  ...ConfigBaseCommand.flags,
};

module.exports = StatusCommand;
