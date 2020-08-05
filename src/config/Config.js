/**
 * Store loaded config data
 */
class Config {
  constructor() {
    this.config = new Object();
  }

  /**
   * Get name of config set
   */
  getName() {
    //console.log(this.config);
    return this.config;
  }

  /**
   * Get named property of config set
   */
  get(path) {
    return this.config[path];
  }

  /**
   * Set named property of config set
   */
  set(path, value) {
    this.config[path] = value;
  }

  reset() {

  }


}

module.exports = Config;
