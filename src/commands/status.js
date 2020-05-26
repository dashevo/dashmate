const os = require('os');
const publicip = require('public-ip');
const prettyms = require('pretty-ms');
const prettybyte = require('pretty-bytes');
const {table} = require('table');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

const PRESETS = require('../presets');

class StatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset, 'system': targetSystem,
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

    if (targetSystem === 'host') {
      data.push(['Property', 'Value']);
      data.push(['Hostname', os.hostname()]);
      data.push(['Uptime', prettyms(os.uptime() * 1000)]);
      data.push(['Platform', os.platform()]);
      data.push(['Username', os.userInfo().username]);
      data.push(['Loadavg', os.loadavg()]);
      data.push(['Diskfree', 0]); // Waiting for feature: https://github.com/nodejs/node/pull/31351
      data.push(['Memory', prettybyte(os.totalmem()) + ' / ' + prettybyte(os.freemem())]);
      data.push(['CPUs', os.cpus().length]);
      data.push(['IP', await publicip.v4()]);
      
    }

    if (targetSystem === 'docker') {
      data.push(['Container', 'ID', 'Status']);
      data.push(...(await dockerCompose.listContainerStatus(preset)));
    }

    if (targetSystem === 'masternode') {
      data.push(['Service', 'Status']);
      data.push(['Version', (await dockerCompose.execCommand(preset, 'core', 'dashd --version')).out.split('\n')[0]])
      data.push(['Blocks', (await dockerCompose.execCommand(preset, 'core', 'dash-cli getblockcount')).out.trim()]);
      // ....
    }

    try {
      output = table(data, tableConfig);
      console.log(output);
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

StatusCommand.description = 'Show masternode status';

StatusCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}, {
  name: 'system',
  required: true,
  description: 'masternode subsystem identifier for status output',
  options: ['host', 'docker', 'masternode']
}];

module.exports = StatusCommand;
