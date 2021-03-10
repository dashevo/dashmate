/**
 * @param {Config} config
 * @return {boolean}
 */
function isPlatformServicesEnabled(config) {
  return config.get('compose.file').includes('docker-compose.platform.yml');
}

module.exports = isPlatformServicesEnabled;
