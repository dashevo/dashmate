const { Command } = require('@oclif/command');

const { asValue } = require('awilix');

const graceful = require('node-graceful');

const getFunctionParams = require('../../util/getFunctionParams');

const createDIContainer = require('../../createDIContainer');

const ConfigFileNotFoundError = require('../../config/errors/ConfigFileNotFoundError');

/**
 * @abstract
 */
class BaseCommand extends Command {
  async init() {
    this.container = await createDIContainer();

    // Load configs
    /**
     * @type {ConfigJsonFileRepository}
     */
    const configManager = this.container.resolve('configRepository');

    let configCollection;
    try {
      // Load config collection from config file
      configCollection = await configManager.read();
    } catch (e) {
      // Create default config collection if config file is not present
      // on the first start for example

      if (!(e instanceof ConfigFileNotFoundError)) {
        throw e;
      }

      /**
       * @type {createDefaultConfigs}
       */
      const createDefaultConfigs = this.container.resolve('createDefaultConfigs');

      configCollection = createDefaultConfigs();
    }

    // Register configs collection is the container
    this.container.register({
      configCollection: asValue(configCollection),
    });

    // Graceful exit
    const stopAllContainers = this.container.resolve('stopAllContainers');
    const startedContainers = this.container.resolve('startedContainers');

    graceful.exitOnDouble = false;
    graceful.on('exit', async () => {
      // remove all attached listeners from other libraries to mute there output
      process.removeAllListeners('uncaughtException');
      process.removeAllListeners('unhandledRejection');

      process.on('unhandledRejection', () => {});
      process.on('uncaughtException', () => {});

      // stop and remove all started containers
      await stopAllContainers(startedContainers.getContainers());
    });
  }

  async run() {
    if (!this.runWithDependencies) {
      throw new Error('`run` or `runWithDependencies` must be implemented');
    }

    const params = getFunctionParams(this.runWithDependencies, 2);

    const dependencies = params.map((paramName) => this.container.resolve(paramName));

    const { args, flags } = this.parse(this.constructor);

    return this.runWithDependencies(args, flags, ...dependencies);
  }

  async finally(err) {
    // Save configs collection
    const configRepository = this.container.resolve('configRepository');

    if (this.container.has('configCollection')) {
      const configCollection = this.container.resolve('configCollection');

      await configRepository.write(configCollection);
    }

    // Stop all running containers
    const stopAllContainers = this.container.resolve('stopAllContainers');
    const startedContainers = this.container.resolve('startedContainers');

    await stopAllContainers(startedContainers.getContainers());

    return super.finally(err);
  }
}

module.exports = BaseCommand;
