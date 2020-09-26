const fs = require('fs');
const dots = require('dot');
const crypto = require('crypto');

const writeServiceConfigs = require('./writeServiceConfigs');

/**
 * Render templates for services
 * @param {Config} config
 * @param {String} homeDirPath
 * @returns {Promise<void>}
 */
async function renderServiceTemplates(config, homeDirPath) {
  const rpcpassword = crypto.randomBytes(12).toString('base64');
  const files = fs.readdirSync('./templates');

  dots.templateSettings.strip = false;
  let configFiles = {};
  for (const file of files) {
    const fileContents = fs.readFileSync('./templates/' + file, 'utf-8');
    const fileTemplate = dots.template(fileContents);
    const fileOutput = fileTemplate({ config, rpcpassword });
    configFiles[file] = fileOutput;
  }
  writeServiceConfigs(configFiles, homeDirPath, config.name);
}

module.exports = renderServiceTemplates;
