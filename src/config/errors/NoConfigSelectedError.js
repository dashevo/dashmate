const AbstractError = require('../../errors/AbstractError');

class NoConfigSelectedError extends AbstractError {
  constructor() {
    super(`No config selected`);
  }
}

module.exports = NoConfigSelectedError;
