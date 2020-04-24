const { Command } = require('@oclif/command');

const createDIContainer = require('../../createDIContainer');

class BaseCommand extends Command {
  async init() {
    this.container = await createDIContainer();
  }
}

module.exports = BaseCommand;
