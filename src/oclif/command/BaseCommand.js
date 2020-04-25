const { Command } = require('@oclif/command');

const getFunctionParams = require('../../util/getFunctionParams');

const createDIContainer = require('../../createDIContainer');

/**
 * @abstract
 */
class BaseCommand extends Command {
  async init() {
    this.container = await createDIContainer();
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
}

module.exports = BaseCommand;
