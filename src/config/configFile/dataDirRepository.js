const fs = require('fs');
const path = require('path');
const os = require('os');

const CouldNotCreateDatadirError = require('../errors/CouldNotCreateDatadirError');

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
        throw new CouldNotCreateDatadirError(this.dataDirPath);
      }
    }
  }
}

module.exports = DataDirRepository;
