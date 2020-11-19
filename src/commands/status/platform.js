const { table } = require('table');
const fetch = require('node-fetch');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');

class CoreStatusCommand extends BaseCommand {
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

    // Core status
    const mnsyncStatus = (await coreService.getRpcClient().mnsync('status')).result;

    // Platform status
    let tendermintStatus;
    let tendermintNetInfo;
    if (config.options.network !== 'testnet') {
      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        tendermintStatus = JSON.parse(await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`).then((res) => res.text()));
        tendermintNetInfo = JSON.parse(await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`).then((res) => res.text()));
      }
    }

    // Build table
    if (config.options.network !== 'testnet') {
      rows.push(['Tenderdash Version', tendermintStatus.result.node_info.version]);
      rows.push(['Network', tendermintStatus.result.node_info.network]);
      rows.push(['Status', '-']);
      rows.push(['Block height', tendermintStatus.result.sync_info.latest_block_height]);
      rows.push(['Remote block height', '-']);
      rows.push(['Peer count', tendermintNetInfo.result.n_peers]);
      rows.push(['App hash', tendermintStatus.result.sync_info.latest_app_hash]);
      rows.push(['HTTP service', '-']);
      rows.push(['HTTP port', '-']);
      rows.push(['gRPC service', '-']);
      rows.push(['gRPC port', '-']);
      rows.push(['P2P service', '-']);
      rows.push(['P2P port', '-']);
      rows.push(['RPC service', '-']);
    }
    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

CoreStatusCommand.description = 'Show status overview';

CoreStatusCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = CoreStatusCommand;
