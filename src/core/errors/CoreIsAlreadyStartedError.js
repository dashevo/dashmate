class CoreIsAlreadyStartedError extends Error {
  constructor() {
    super();

    this.name = this.constructor.name;
    this.message = 'Core service is already started. Please docker-compose before run.';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = CoreIsAlreadyStartedError;
