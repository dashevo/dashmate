class CoreStartError extends Error {
  /**
   * @param {Object} dockerComposeRunResult
   */
  constructor(dockerComposeRunResult) {
    super();

    this.name = this.constructor.name;
    this.message = `Can't start Core service: ${dockerComposeRunResult.err}`;

    this.dockerComposeRunResult = dockerComposeRunResult;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get docker compose run result
   *
   * @return {Object}
   */
  getDockerComposeRunResult() {
    return this.dockerComposeRunResult;
  }
}

module.exports = CoreStartError;
