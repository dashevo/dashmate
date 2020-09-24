const fs = require('fs');
const dots = require('dot');
const crypto = require('crypto');

/**
 * Render templates for services
 * @param {Config} config
 * @returns {Promise<void>}
 */
async function renderServiceTemplates(config) {
  const rpcpassword = crypto.randomBytes(12).toString('base64');
  try {
    const files = fs.readdirSync('./templates');
    console.log(config);
    for (const file of files) {
      console.log(file);
      const fileContents = fs.readFileSync('./templates/' + file, 'utf-8');
      const fileTemplate = dots.template(fileContents);
      const fileOutput = fileTemplate({config, rpcpassword});
      console.log(fileOutput);
    }
  } catch (e) {
    console.error('fail');
  }
}

module.exports = renderServiceTemplates;
