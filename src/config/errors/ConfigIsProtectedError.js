const AbstractError = require('../../errors/AbstractError');

class ConfigIsProtectedError extends AbstractError {
  /**
   * @param {string} configName
   */
  constructor(configName) {
    super(`Config with name '${configName}' is protected`);

    this.configName = configName;
  }

  /**
   * @returns {string}
   */
  getConfigName() {
    return this.configName;
  }
}

module.exports = ConfigIsProtectedError;
