const AbstractError = require('../../errors/AbstractError');

class MuteOneLineError extends AbstractError {
  /**
   * @param {Error} error
   */
  constructor(error) {
    super('SIGINT');

    if (error.message.trimEnd().includes('\n')) {
      throw error;
    }

    this.error = error;
  }

  /**
   * Get thrown error
   * @return {Error}
   */
  getError() {
    return this.error;
  }
}

module.exports = MuteOneLineError;
