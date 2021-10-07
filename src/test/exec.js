const { exec } = require('child_process');

/**
 *
 * @param {string} command
 * @param [options]
 * @param {string} [options.cwd] - working directory to run command from
 * @param {boolean} [options.forwardStdout] - forwarding stdout of the command to console.log
 * @param {number} [options.timeout] - kill the command after specified timeout
 * @returns {Promise<string>}
 */
module.exports = function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, options, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });

    if (options.forwardStdout) {
      childProcess.stdout.on('data', (data) => {
        process.stdout.emit('data', data);
      });
    }
  });
};
