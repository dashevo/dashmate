const { table } = require('table');
const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');

class MasternodeStatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    {
      config: configName,
    },
    dockerCompose,
    configCollection,
  ) {
    const config = configName === null
      ? configCollection.getDefaultConfig()
      : configCollection.getConfig(configName);

    const rows = [];

    // Version
    const versionOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dashd --version',
    );

    rows.push(['Version', versionOutput.out.split('\n')[0]]);

    // Block count
    const blockCountOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli getblockcount',
    );

    rows.push(['Blocks', blockCountOutput.out.trim()]);

    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

MasternodeStatusCommand.description = 'Show masternode status details';

MasternodeStatusCommand.flags = {
  config: flagTypes.string({
    description: 'configuration name to use',
    default: null,
  }),
};

module.exports = MasternodeStatusCommand;
