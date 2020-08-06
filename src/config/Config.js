const lodashGet = require('lodash.get');
const lodashSet = require('lodash.set');

class Config {
  /**
   * @param {string} name
   * @param {Object} options
   */
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
  }

  /**
   * Get name
   */
  getName() {
    return this.name;
  }

  /**
   * Get config option
   */
  get(path) {
    return lodashGet(this.options, path);
  }

  /**
   * Set config option
   */
  set(path, value) {
    lodashSet(this.options, path, value);

    return this;
  }

  /**
   * Get options
   *
   * @returns {Object}
   */
  getOptions() {
    return this.options;
  }

  /**
   * Set options
   *
   * @param {Object} options
   * @returns {Config}
   */
  setOptions(options) {
    this.options = options;

    return this;
  }
}

module.exports = Config;
