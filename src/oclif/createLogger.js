/**
 * Create Oclif standalone logger
 *
 * @param {Command} command
 * @return {{warn: *, log: *, error: *, info: *}}
 */
function createLogger(command) {
  return {
    log: command.log.bind(command),
    info: command.log.bind(command),
    warn: command.warn.bind(command),
    error: command.error.bind(command),
  };
}

module.exports = createLogger;
