const fs = require('fs');

/**
 * Simulate UNIX `touch` command
 * @param {string} filePath
 */
function touchFile(filePath) {
  const time = new Date();

  try {
    fs.utimesSync(filePath, time, time);
  } catch (e) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }
}

module.exports = touchFile;
