const fs = require('fs');

const dots = require('dot');

function applyTemplateToFile(filename) {
  const file = fs.readFileSync(filename, 'utf-8');
  console.log(file);
  var tempFn = dots.template(file);
  var resultText = tempFn({insightport: '5000'});
  console.log(resultText);
}

module.exports = applyTemplateToFile;
