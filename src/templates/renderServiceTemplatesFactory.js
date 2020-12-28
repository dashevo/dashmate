const fs = require('fs');
const path = require('path');
const dots = require('dot');
const glob = require('glob');

/**
 * @return {renderServiceTemplates}
 */
function renderServiceTemplatesFactory() {
  /**
   * Render templates for services
   *
   * @typedef {renderServiceTemplates}
   * @param {Config} config
   *
   * @return {Object<string,string>}
   */
  function renderServiceTemplates(config) {
    dots.templateSettings.strip = false;

    const templatesPath = path.join(__dirname, '..', '..', 'templates');

    // Don't create blank node config objects for tenderdash init
    const skipEmpty = {
      genesis: 'platform.drive.tenderdash.genesis',
      node_key: 'platform.drive.tenderdash.nodeKey',
      priv_validator_key: 'platform.drive.tenderdash.validatorKey',
    };

    let omitString = '';
    for (const key in skipEmpty) {
      if (Object.values(config.get(skipEmpty[key])).length === 0) {
        omitString += `${key}|`;
      }
    }
    const templatePaths = glob.sync(`${templatesPath}/**/!(${omitString.slice(0, -1)}).*.template`);

    const configFiles = {};
    for (const templatePath of templatePaths) {
      const templateString = fs.readFileSync(templatePath, 'utf-8');
      const template = dots.template(templateString);

      const configPath = templatePath
        .substring(templatesPath.length + 1)
        .replace('.template', '');

      configFiles[configPath] = template(config.options);
    }

    return configFiles;
  }

  return renderServiceTemplates;
}

module.exports = renderServiceTemplatesFactory;
