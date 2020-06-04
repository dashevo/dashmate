const {table} = require('table');

const BaseCommand = require('../../oclif/command/BaseCommand');

const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const PRESETS = require('../../presets');

class DockerStatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
    },
    flags,
    dockerCompose,
  ) {
    const data = [];
    let output;

    const tableConfig = {
      //singleLine: true,
      drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
      }
    };

    data.push(['Container', 'ID', 'Status']);
    data.push(...(await dockerCompose.listContainerStatus(preset)));

    try {
      output = table(data, tableConfig);
      console.log(output);
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

DockerStatusCommand.description = 'Show Docker status details';

DockerStatusCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}];

module.exports = DockerStatusCommand;
