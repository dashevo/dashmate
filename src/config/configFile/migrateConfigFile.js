const semver = require('semver');

const configOptionMigrations = require('../../../configs/migrations');

function migrateConfigFile(config, fromVersion, toVersion) {
  if (fromVersion === toVersion) {
    return config;
  }

  return Object.keys(configOptionMigrations)
    .filter((version) => (semver.gt(version, fromVersion) && semver.lte(version, toVersion)))
    .sort(semver.compare)
    .reduce((migratedOptions, version) => {
      const migrationFunction = configOptionMigrations[version];
      return migrationFunction(config);
    }, config);
}

module.exports = migrateConfigFile;
