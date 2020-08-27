const fs = require('fs');
const path = require('path');
const os = require('os');

const CouldNotCreateHomeDirError = require('../errors/CouldNotCreateHomeDirError')

/**
 * @param {string} homeDirPath
 * @return {ensureHomeDir}
 */
function ensureHomeDirFactory(homeDirPath = path.resolve(os.homedir(), '.mn')) {
  /**
   * @typedef {ensureHomeDir}
   * @return {string} homeDirPath
   */
  function ensureHomeDir() {
    if (!fs.existsSync(homeDirPath)) {
      try {
        fs.mkdirSync(homeDirPath);
      } catch (e) {
        throw new CouldNotCreateHomeDirError(homeDirPath);
      }
      // Should also test for proper owner and write permission of the dir?
    }
    if (fs.existsSync(homeDirPath)) {
      return homeDirPath;
    }
  }
  return ensureHomeDir;
}

module.exports = ensureHomeDirFactory;
