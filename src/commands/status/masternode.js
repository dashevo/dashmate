const { table } = require('table');
const fetch = require('node-fetch');

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
    const dashdVersion = (await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dashd --version',
    )).out.split('\n')[0];

    // Sync status
    const mnsyncStatus = JSON.parse((await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli mnsync status'
    )).out);

    // Header and block count
    const blockchaininfo = JSON.parse((await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli getblockchaininfo',
    )).out);

    // Masternode data
    const masternodeStatus = JSON.parse((await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dash-cli masternode status',
    )).out);

    // Sentinel
    const sentinelState = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    )).out.split('\n')[0];

    const tendermintVersion = (await dockerCompose.execCommand(
      config.toEnvs(),
      'drive_tendermint',
      'tendermint version',
    )).out.split('\n')[0];

    const tendermintStatus = JSON.parse((await dockerCompose.execCommand(
      config.toEnvs(),
      'drive_tendermint',
      'curl localhost:26657/status',
    )).out);

    // Port check
    const portState = await fetch('https://mnowatch.org/' + config.options.core.p2p.port + '/').then(res => res.text());

    // Build table
    rows.push(['Dashd Version', dashdVersion]);
    rows.push(['Sync Status', mnsyncStatus.AssetName]);
    rows.push(['Headers', blockchaininfo.headers]);
    rows.push(['Blocks', blockchaininfo.blocks]);
    rows.push(['Masternode Status', masternodeStatus.state]);
    if (masternodeStatus.state === 'READY') {
      rows.push(['ProTx Hash', masternodeStatus.proTxHash]);
      rows.push(['Service', masternodeStatus.dmnState.service]);
      rows.push(['PoSe Penalty', masternodeStatus.dmnState.PoSePenalty]);
    }
    rows.push(['Sentinel', (sentinelState !== '' ? sentinelState : 'No errors' )]);
    rows.push(['Port Check', config.options.core.p2p.port + ' ' + portState]);
    if (config.network !== 'testnet') {
      rows.push(['Tendermint Version', tendermintVersion]);
      rows.push(['Tendermint Blocks', tendermintStatus.result.sync_info.latest_block_height]);
      rows.push(['Tendermint Sync', !tendermintStatus.result.sync_info.catching_up]);
    }
    
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
