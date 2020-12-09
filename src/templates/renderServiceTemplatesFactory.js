const fs = require('fs');
const path = require('path');
const dots = require('dot');

/**
 * @param {writeServiceConfigs} writeServiceConfigs
 * @param {string} homeDirPath
 *
 * @return {renderServiceTemplates}
 */
function renderServiceTemplatesFactory(writeServiceConfigs, homeDirPath) {
  /**
   * Render templates for services
   *
   * @typedef {renderServiceTemplates}
   * @param {Config} config
   *
   * @return {Promise<void>}
   */
  function renderServiceTemplates(config) {
    dots.templateSettings.strip = false;

    const templatesPath = path.join(__dirname, '../../templates');

    const files = fs.readdirSync(templatesPath);

    const configFiles = {};
    for (const file of files) {
      const fileContents = fs.readFileSync(path.join(templatesPath, file), 'utf-8');
      const fileTemplate = dots.template(fileContents);

      configFiles[file] = fileTemplate(config.options);
    }

    writeServiceConfigs(configFiles, homeDirPath, config.name);
  }

  return renderServiceTemplates;
}

module.exports = renderServiceTemplatesFactory;
