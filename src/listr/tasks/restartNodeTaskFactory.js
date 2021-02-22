const { Listr } = require('listr2');

/**
 * @param {startNodeTask} startNodeTask
 * @param {stopNodeTask} stopNodeTask
 *
 * @return {restartNodeTask}
 */
function restartNodeTaskFactory(startNodeTask, stopNodeTask) {
  /**
   * Restart node
   * @typedef {restartNodeTask}
   *
   * @param {Config} config
   * @param {Object} options
   *
   * @return {Listr}
   */
  function restartNodeTask(config, options) {
    return new Listr([
      {
        task: () => stopNodeTask(config, options),
      },
      {
        task: () => startNodeTask(config, options),
      },
    ]);
  }

  return restartNodeTask;
}

module.exports = restartNodeTaskFactory;
