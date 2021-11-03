const os = require('os');
const publicIp = require('public-ip');
const prettyMs = require('pretty-ms');
const prettyByte = require('pretty-bytes');
const { table } = require('table');

const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');
const getFormat = require('../../util/getFormat');
const { OUTPUT_FORMATS } = require('../../constants');

class HostStatusCommand extends ConfigBaseCommand {
  /**
   * @return {Promise<void>}
   */
  async runWithDependencies(args, flags) {
    const outputRows = {
      Hostname: os.hostname(),
      Uptime: prettyMs(os.uptime() * 1000),
      Platform: os.platform(),
      Arch: os.arch(),
      Username: os.userInfo().username,
      Diskfree: 0,
      Memory: `${prettyByte(os.totalmem())} / ${prettyByte(os.freemem())}`,
      CPUs: os.cpus().length,
      IP: await publicIp.v4(),
    };

    let output;

    if (getFormat(flags) === OUTPUT_FORMATS.JSON) {
      output = JSON.stringify(outputRows);
    } else {
      const rows = [];
      Object.keys(outputRows).forEach((key) => {
        rows.push([key, outputRows[key]]);
      });
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
