const AbstractError = require('../../errors/AbstractError');

class ServiceIsNotRunningError extends AbstractError {
  /**
   * @param {string} network
   * @param {string} serviceName
   */
  constructor(network, serviceName) {
    super(`Service ${serviceName} for ${network} is not running. Please run the service first.`);

    this.network = network;
    this.serviceName = serviceName;
  }

  /**
   * Get network
   *
   * @return {string}
   */
  getNetwork() {
    return this.network;
  }

  /**
   * Get service name
   *
   * @return {string}
   */
  getServiceName() {
    return this.serviceName;
  }
}

module.exports = ServiceIsNotRunningError;
