const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');
const os = require('os');
const publicIp = require('public-ip');
const prettyMs = require('pretty-ms');
const prettyByte = require('pretty-bytes');
const { table } = require('table');
const getFormat = require('../../util/getFormat');
const stripAnsi = require('../../util/stripAnsi');
const { OUTPUT_FORMATS } = require('../../constants');

const BaseCommand = require('../../oclif/command/BaseCommand');

class HostStatusCommand extends ConfigBaseCommand {
  /**
   * @return {Promise<void>}
   */
  async runWithDependencies(flags) {
    const rows = [];

    rows.push(['Hostname', os.hostname()]);
    rows.push(['Uptime', prettyMs(os.uptime() * 1000)]);
    rows.push(['Platform', os.platform()]);
    rows.push(['Arch', os.arch()]);
    rows.push(['Username', os.userInfo().username]);
    rows.push(['Loadavg', os.loadavg().map((load) => load.toFixed(2))]);
    rows.push(['Diskfree', 0]); // Waiting for feature: https://github.com/nodejs/node/pull/31351
    rows.push(['Memory', `${prettyByte(os.totalmem())} / ${prettyByte(os.freemem())}`]);
    rows.push(['CPUs', os.cpus().length]);
    rows.push(['IP', await publicIp.v4()]);
    
    const outputFormat = getFormat(flags);
    console.log(flags);
    let output;
    
    if (outputFormat === OUTPUT_FORMATS.JSON) {
      output = stripAnsi(JSON.stringify(outputRows));
    }
    else {
    output = table(rows, { singleLine: true });
    }
    // eslint-disable-next-line no-console
    console.log(output);
  }
}

HostStatusCommand.description = 'Show host status details';

HostStatusCommand.flags = {
  ...ConfigBaseCommand.flags,
};

module.exports = HostStatusCommand;
