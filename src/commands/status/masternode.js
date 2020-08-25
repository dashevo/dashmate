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
    const blockchainInfo = JSON.parse((await dockerCompose.execCommand(
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

    let tendermintVersion;
    let tendermintStatus;

    if (config.network !== 'testnet') {
      // Tendermint
      tendermintVersion = (await dockerCompose.execCommand(
        config.toEnvs(),
        'drive_tendermint',
        'tendermint version',
      )).out.split('\n')[0];

      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        tendermintStatus = JSON.parse((await dockerCompose.execCommand(
          config.toEnvs(),
          'drive_tendermint',
          'curl localhost:26657/status',
        )).out);
      }
    }

    // Port check
    const corePort = await fetch('https://mnowatch.org/' + config.options.core.p2p.port + '/').then(res => res.text());
    const tendermintPort = await fetch('https://mnowatch.org/26656/').then(res => res.text());

    // Build table
    rows.push(['Dashd Version', dashdVersion]);
    rows.push(['Sync Status', mnsyncStatus.AssetName]);
    rows.push(['Core Port', config.options.core.p2p.port + ' ' + corePort]);
    rows.push(['Headers', blockchainInfo.headers]);
    rows.push(['Blocks', blockchainInfo.blocks]);
    rows.push(['Core Sync', mnsyncStatus.IsSynced]);
    rows.push(['Masternode Status', masternodeStatus.state]);
    if (masternodeStatus.state === 'READY') {
      rows.push(['ProTx Hash', masternodeStatus.proTxHash]);
      rows.push(['Service', masternodeStatus.dmnState.service]);
      rows.push(['PoSe Penalty', masternodeStatus.dmnState.PoSePenalty]);
    }
    rows.push(['Sentinel', (sentinelState !== '' ? sentinelState : 'No errors')]);
    if (config.network !== 'testnet') {
      rows.push(['Tendermint Version', tendermintVersion]);
      rows.push(['Tendermint Port', '26656 ' + tendermintPort]);
      if (mnsyncStatus.IsSynced === true) {
        rows.push(['Tendermint Blocks', tendermintStatus.result.sync_info.latest_block_height]);
        rows.push(['Tendermint Sync', !tendermintStatus.result.sync_info.catching_up]);
      }
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
