const fs = require('fs');
const dots = require('dot');

async function renderServiceTemplates(config) {
  const rpcpassword = 'adsf0h923qiud';
  try {
    const files = fs.readdirSync('./templates');
    console.log(config);
    for (const file of files) {
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
