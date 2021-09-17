const fs = require('fs');

/**
 * Touch or create an empty file
 *
 * @param {string} filePath
 *
 * @returns {void}
 */
function touchFile(filePath) {
  const time = new Date();

  try {
    fs.utimesSync(filePath, time, time);
  } catch (err) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }
}

module.exports = touchFile;
