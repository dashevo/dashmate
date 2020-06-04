const os = require('os');
const publicip = require('public-ip');
const prettybyte = require('pretty-bytes');
const {table} = require('table');

const BaseCommand = require('../../oclif/command/BaseCommand');

const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const PRESETS = require('../../presets');

class StatusCommand extends BaseCommand {
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

    data.push(['Property', 'Value']);
    data.push(['Hostname', os.hostname()]);
    data.push(['Memory', prettybyte(os.totalmem()) + ' / ' + prettybyte(os.freemem())]);
    data.push(['CPUs', os.cpus().length]);
    data.push(['IP', await publicip.v4()]);
    data.push(['Version', (await dockerCompose.execCommand(preset, 'core', 'dashd --version')).out.split('\n')[0]])
    data.push(['Blocks', (await dockerCompose.execCommand(preset, 'core', 'dash-cli getblockcount')).out.trim()]);

    try {
      output = table(data, tableConfig);
      console.log(output);
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

StatusCommand.description = 'Show status information';

StatusCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}];

module.exports = StatusCommand;
