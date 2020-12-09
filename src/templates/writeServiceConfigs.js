const fs = require('fs');
const path = require('path');

/**
 * Write service config files
 *
 * @typedef {writeServiceConfigs}
 * @param {Object} configFiles
 * @param {string} homedirPath
 * @param {string} configName
 *
 * @return {Promise<void>}
 */
function writeServiceConfigs(configFiles, homedirPath, configName) {
  const configPath = path.join(homedirPath, configName);

  try {
    fs.mkdirSync(configPath);
  } catch (e) {
    // do nothing
  }

  for (const configFile of Object.keys(configFiles)) {
    const filePath = path.join(configPath, configFile.replace('.template', ''));

    fs.writeFileSync(filePath, configFiles[configFile], 'utf8');
  }
}

module.exports = writeServiceConfigs;
