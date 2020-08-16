const fs = require('fs');
const path = require('path');
const os = require('os');

class DataDirRepository {
  constructor() {
    this.dataDirPath = path.resolve(os.homedir(), '.mn');
  }

  /**
   * Validate datadir
   */
  async ensureDataDir() {
    if (!fs.existsSync(this.dataDirPath)) {
      try {
        fs.mkdirSync(this.dataDirPath);
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   * Create datadir for config
   * @param configName
   */
  async ensureDataSubDirFor(configName) {
    const configDataDirPath = path.resolve(this.dataDirPath, configName);
    if (!fs.existsSync(configDataDirPath)) {
      try {
        fs.mkdirSync(configDataDirPath);
      } catch (e) {
        console.log(e);
      }
    }
  }
}

module.exports = DataDirRepository;
