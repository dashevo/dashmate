const AbstractError = require('../../errors/AbstractError');

class CouldNotCreateDatadirError extends AbstractError {
  /**
   * @param {string} configFilePath
   */
  constructor(datadirPath) {
    super(`Could not create datadir at '${datadirPath}'`);

    this.datadirPath = datadirPath;
  }

  /**
   * @returns {string}
   */
  getDatadirPath() {
    return this.datadirPath;
  }
}

module.exports = CouldNotCreateDatadirError;
