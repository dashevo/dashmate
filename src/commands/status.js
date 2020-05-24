const Listr = require('listr');

const os = require('os');
const publicip = require('public-ip');
const prettyms = require('pretty-ms');
const prettybyte = require('pretty-bytes');

const BaseCommand = require('../oclif/command/BaseCommand');

const UpdateRendererWithOutput = require('../oclif/renderer/UpdateRendererWithOutput');

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
      preset,
    },
    flags,
    dockerCompose,
  ) {
    const status = {
      host: {},
      docker: {},
      masternode: {},
    };
    let existingContainers = [];
    const tasks = new Listr([
      {
        title: 'Show host status',
        task: () => (
          new Listr([
            {
              title: 'Fetch hostname',
              task: () => status.host.hostname = os.hostname()
            },
            {
              title: 'Fetch uptime',
              task: () => status.host.uptime = prettyms(os.uptime() * 1000)
            },
            {
              title: 'Fetch platform',
              task: () => status.host.platform = os.platform()
            },
            {
              title: 'Fetch user info',
              task: () => status.host.user = os.userInfo().username
            },
            {
              title: 'Fetch load average',
              task: () => status.host.loadavg = os.loadavg()
            },
            {
              // Waiting for feature: https://github.com/nodejs/node/pull/31351
              title: 'Fetch disk info',
              enabled: false,
              task: () => status.host.diskfree = 0
            },
            {
              title: 'Fetch memory info',
              task: () => status.host.memfree = prettybyte(os.totalmem()) + ' / ' + prettybyte(os.freemem())
            },
            {
              title: 'Fetch CPU info',
              task: () => status.host.cpus = os.cpus().length
            },
            {
              title: 'Fetch IP info',
              task: async () => {
                status.host.ip = await publicip.v4();
              }
            },
          ])
        )
      },
      {
        title: 'Show running services',
        task: () => (
          new Listr([
            {
              title: 'Fetch existing containers',
              task: async () => {
                existingContainers = await dockerCompose.listContainers(preset);
              }
            },
            {
              title: 'Fetch container states',
              task: async () => {
                for (const container of existingContainers) {
                  status.docker[container] = await dockerCompose.isServiceRunning(preset, container);
                }
              }
            }
          ])
        )
      }
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    try {
      await tasks.run();
    } catch (e) {
      // we already output errors through listr
      throw new MuteOneLineError(e);
    }
    console.log(JSON.stringify(status, null, 2));
  }
}

StatusCommand.description = 'Show masternode status';

StatusCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}];

module.exports = StatusCommand;
