const semver = require('semver');

const configOptionMigrations = require('./configOptionMigrations');

function migrateConfigOptions(name, options, fromVersion, toVersion) {
  if (fromVersion === toVersion) {
    return options;
  }

  return Object.keys(configOptionMigrations)
    .filter((version) => (semver.gt(version, fromVersion) && semver.lte(version, toVersion)))
    .sort((v1, v2) => semver.compare(v1, v2))
    .reduce((migratedOptions, version) => {
      const migrationFunction = configOptionMigrations[version];
      return migrationFunction(name, migratedOptions);
    }, options);
}

module.exports = migrateConfigOptions;
