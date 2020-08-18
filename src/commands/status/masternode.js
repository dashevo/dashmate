const { table } = require('table');

const BaseCommand = require('../../oclif/command/BaseCommand');

class MasternodeStatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    dockerCompose,
    config,
  ) {
    const rows = [];

    // Version
    const versionOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dashd --version',
    );

    rows.push(['Version', versionOutput.out.split('\n')[0]]);

    // Sync status
    const syncStatusOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli mnsync status'
    );

    rows.push(['Sync Status', JSON.parse(syncStatusOutput.out).AssetName]);

    // Header and block count
    const blockchaininfoOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli getblockchaininfo',
    );

    rows.push(['Blocks', JSON.parse(blockchaininfoOutput.out).blocks]);
    rows.push(['Headers', JSON.parse(blockchaininfoOutput.out).headers]);

    // Header and block count
    const masternodeStatusOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli masternode status',
    );

    rows.push(['Masternode', JSON.parse(masternodeStatusOutput.out).status]);

    // Sentinel
    const sentinelOutput = await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    );
    
    const sentinelState = sentinelOutput.out.split('\n')[0];

    rows.push(['Sentinel', (sentinelState !== '' ? sentinelState : 'No errors' )]);

    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

MasternodeStatusCommand.description = 'Show masternode status details';

MasternodeStatusCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = MasternodeStatusCommand;
