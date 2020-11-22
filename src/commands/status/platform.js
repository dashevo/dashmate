const { table } = require('table');
const fetch = require('node-fetch');
const chalk = require('chalk');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');

const ContainerIsNotPresentError = require('../../docker/errors/ContainerIsNotPresentError');

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
    if (config.options.network === 'testnet') {
      // eslint-disable-next-line no-console
      console.log('Platform is not supported on testnet yet!');
      this.exit();
    }

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

    // Collect data
    const { result: mnsyncStatus } = await coreService.getRpcClient().mnsync('status');

    // curl fails if tendermint has not started yet because abci is waiting for core to sync
    if (mnsyncStatus.IsSynced === false) {
      // eslint-disable-next-line no-console
      console.log('Platform status is not available until core sync is complete!');
      this.exit();
    }

    const tendermintStatusRes = await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`).then((res) => res.text());
    const tendermintStatus = JSON.parse(tendermintStatusRes);
    const tendermintNetInfoRes = await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/net_info`).then((res) => res.text());
    const tendermintNetInfo = JSON.parse(tendermintNetInfoRes);
    const explorerBlockHeightRes = await fetch('https://rpc.cloudwheels.net:26657/status').then((res) => res.text());
    const explorerBlockHeight = JSON.parse(explorerBlockHeightRes);

    let httpPortState = await fetch(`https://mnowatch.org/${config.options.platform.dapi.nginx.http.port}/`).then((res) => res.text());
    let gRpcPortState = await fetch(`https://mnowatch.org/${config.options.platform.dapi.nginx.grpc.port}/`).then((res) => res.text());
    let p2pPortState = await fetch(`https://mnowatch.org/${config.options.platform.drive.tendermint.p2p.port}/`).then((res) => res.text());

    // Determine status
    let status;
    try {
      ({
        State: {
          Status: status,
        },
      } = await dockerCompose.inspectService(config.toEnvs(), 'drive_tendermint'));
    } catch (e) {
      if (e instanceof ContainerIsNotPresentError) {
        status = 'not started';
      }
    }
    if (status === 'running' && tendermintStatus.result.sync_info.catching_up === true) {
      status = `syncing ${((tendermintStatus.result.sync_info.latest_block_height
        / explorerBlockHeight.result.sync_info.latest_block_height)
        * 100).toFixed(2)}%`;
    }

    // Apply colors
    if (status === 'running') {
      status = chalk.green(status);
    } else if (status.includes('syncing')) {
      status = chalk.yellow(status);
    } else {
      status = chalk.red(status);
    }

    let blocks;
    if (tendermintStatus.result.sync_info.latest_block_height
      >= explorerBlockHeight.result.sync_info.latest_block_height) {
      blocks = chalk.green(tendermintStatus.result.sync_info.latest_block_height);
    } else {
      blocks = chalk.red(tendermintStatus.result.sync_info.latest_block_height);
    }

    if (httpPortState === 'OPEN') {
      httpPortState = chalk.green(httpPortState);
    } else {
      httpPortState = chalk.red(httpPortState);
    }
    if (gRpcPortState === 'OPEN') {
      gRpcPortState = chalk.green(gRpcPortState);
    } else {
      gRpcPortState = chalk.red(gRpcPortState);
    }
    if (p2pPortState === 'OPEN') {
      p2pPortState = chalk.green(p2pPortState);
    } else {
      p2pPortState = chalk.red(p2pPortState);
    }

    // Build table
    rows.push(['Tenderdash Version', tendermintStatus.result.node_info.version]);
    rows.push(['Network', tendermintStatus.result.node_info.network]);
    rows.push(['Status', status]);
    rows.push(['Block height', blocks]);
    rows.push(['Remote block height', explorerBlockHeight.result.sync_info.latest_block_height]);
    rows.push(['Peer count', tendermintNetInfo.result.n_peers]);
    rows.push(['App hash', tendermintStatus.result.sync_info.latest_app_hash]);
    rows.push(['HTTP service', `${config.options.externalIp}:${config.options.platform.dapi.nginx.http.port}`]);
    rows.push(['HTTP port', `${config.options.platform.dapi.nginx.http.port} ${httpPortState}`]);
    rows.push(['gRPC service', `${config.options.externalIp}:${config.options.platform.dapi.nginx.grpc.port}`]);
    rows.push(['gRPC port', `${config.options.platform.dapi.nginx.grpc.port} ${gRpcPortState}`]);
    rows.push(['P2P service', `${config.options.externalIp}:${config.options.platform.drive.tendermint.p2p.port}`]);
    rows.push(['P2P port', `${config.options.platform.drive.tendermint.p2p.port} ${p2pPortState}`]);
    rows.push(['RPC service', `127.0.0.1:${config.options.platform.drive.tendermint.rpc.port}`]);
    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

CoreStatusCommand.description = 'Show platform status details';

CoreStatusCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = CoreStatusCommand;
