const fs = require('fs');

const CouldNotCreateHomeDirError = require('./config/errors/CouldNotCreateHomeDirError');
const HomeDirIsNotWritableError = require('./config/errors/HomeDirIsNotWritableError');

const { HOME_DIR_PATH: homeDirPath } = require('./constants');

/**
 * @return {ensureHomeDir}
 */
function ensureHomeDirFactory() {
  /**
   * @typedef {ensureHomeDir}
   * @return {string} homeDirPath
   */
  function ensureHomeDir() {
    if (fs.existsSync(homeDirPath)) {
      try {
        // eslint-disable-next-line no-bitwise
        fs.accessSync(__dirname, fs.constants.R_OK | fs.constants.W_OK);
      } catch (e) {
        throw new HomeDirIsNotWritableError(homeDirPath);
      }

      return homeDirPath;
    }

    try {
      fs.mkdirSync(homeDirPath);
    } catch (e) {
      throw new CouldNotCreateHomeDirError(homeDirPath);
    }

    return homeDirPath;
  }

  return ensureHomeDir;
}

module.exports = ensureHomeDirFactory;
