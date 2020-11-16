const { table } = require('table');
const fetch = require('node-fetch');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');

class MasternodeStatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {CoreService} coreService
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    dockerCompose,
    createRpcClient,
    config,
  ) {
    const rows = [];

    const coreService = new CoreService(
      createRpcClient(
        {
          port: config.get('core.rpc.port'),
          user: config.get('core.rpc.user'),
          pass: config.get('core.rpc.password'),
        },
      ),
      dockerCompose.docker.getContainer('core'),
    );

    // Version
    const dashdVersion = (await dockerCompose.execCommand(
      config.toEnvs(),
      'core',
      'dashd --version',
    )).out.split('\n')[0];

    // Sync status
    const mnsyncStatus = (await coreService.getRpcClient().mnsync('status')).result;

    // Header and block count
    const blockchainInfo = (await coreService.getRpcClient().getBlockchainInfo()).result;

    // Masternode data
    const masternodeStatus = (await coreService.getRpcClient().masternode('status')).result;

    // Sentinel
    const sentinelState = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    )).out.split('\n')[0];

    let tendermintVersion;
    let tendermintStatus;

    if (config.options.network !== 'testnet') {
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
    const corePortState = await fetch(`https://mnowatch.org/${config.options.core.p2p.port}/`).then((res) => res.text());

    if (config.options.network !== 'testnet') {
      const tendermintPortNum = (await dockerCompose.inspectService(
        config.toEnvs(),
        'drive_tendermint',
      )).NetworkSettings.Ports['26656/tcp'][0].HostPort;

      const tendermintPortState = await fetch(`https://mnowatch.org/${tendermintPortNum}/`).then((res) => res.text());
    }

    // Build table
    rows.push(['Dashd Version', dashdVersion]);
    rows.push(['Sync Status', mnsyncStatus.AssetName]);
    rows.push(['Core Port', `${config.options.core.p2p.port} ${corePortState}`]);
    rows.push(['Headers', blockchainInfo.headers]);
    rows.push(['Blocks', blockchainInfo.blocks]);
    rows.push(['Core Sync', mnsyncStatus.IsSynced]);
    rows.push(['Masternode State', masternodeStatus.state]);
    rows.push(['Masternode Status', masternodeStatus.status]);
    if (masternodeStatus.state === 'READY') {
      rows.push(['ProTx Hash', masternodeStatus.proTxHash]);
      rows.push(['Service', masternodeStatus.dmnState.service]);
      rows.push(['PoSe Penalty', masternodeStatus.dmnState.PoSePenalty]);
    }
    rows.push(['Sentinel', (sentinelState !== '' ? sentinelState : 'No errors')]);
    if (config.options.network !== 'testnet') {
      rows.push(['Tendermint Version', tendermintVersion]);
      rows.push(['Tendermint Port', `${tendermintPortNum} ${tendermintPortState}`]);
      if (mnsyncStatus.IsSynced === true) {
        rows.push(['Tendermint Blocks', tendermintStatus.result.sync_info.latest_block_height]);
        rows.push(['Tendermint Sync', !tendermintStatus.result.sync_info.catching_up]);
        rows.push(['Tendermint App Hash', tendermintStatus.result.sync_info.latest_app_hash]);
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
