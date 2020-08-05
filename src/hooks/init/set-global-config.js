// Ensure oclif config data is available inside util functions
module.exports = async function (opts) {
  global.config = opts.config;
}
