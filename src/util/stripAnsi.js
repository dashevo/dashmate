/**
 * Strip ANSI escape codes from a string
 * @param {string} string
 */
function stripAnsi(string) {
  //const pattern = [
  //  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  //  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  //].join('|');

  const pattern = 'u001b[0-9]{2,}[a-z]'

  const ansiRegex = new RegExp(pattern, 'g');

  if (typeof string !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }

  string = string.replace(/\[|\]|\\/g, '');
  return string.replace(ansiRegex, '');
}

module.exports = stripAnsi;
