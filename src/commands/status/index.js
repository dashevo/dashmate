const { table } = require('table');
const fetch = require('node-fetch');

const ContainerIsNotPresentError = require('../../docker/errors/ContainerIsNotPresentError');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');

class StatusCommand extends BaseCommand {
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

    // Collect data
    const mnsyncStatus = (await coreService.getRpcClient().mnsync('status')).result;
    const networkInfo = (await coreService.getRpcClient().getNetworkInfo()).result;
    const blockchainInfo = (await coreService.getRpcClient().getBlockchainInfo()).result;
    const masternodeStatus = (await coreService.getRpcClient().masternode('status')).result;

    // Platform status
    let tendermintStatus;
    if (config.options.network !== 'testnet') {
      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        tendermintStatus = JSON.parse(await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`).then((res) => res.text()));
      }
    }

    // Determine status
    let coreStatus;
    try {
      ({
        State: {
          Status: coreStatus,
        },
      } = await dockerCompose.inspectService(config.toEnvs(), 'core'));
    } catch (e) {
      if (e instanceof ContainerIsNotPresentError) {
        coreStatus = 'not started';
      }
    }
    if (coreStatus === 'running') {
      if (mnsyncStatus.AssetName !== 'MASTERNODE_SYNC_FINISHED') {
        coreStatus = `syncing ${(blockchainInfo.verificationprogress * 100).toFixed(2)}%`;
      }
    }

    let platformStatus;
    try {
      ({
        State: {
          Status: platformStatus,
        },
      } = await dockerCompose.inspectService(config.toEnvs(), 'drive_tendermint'));
    } catch (e) {
      if (e instanceof ContainerIsNotPresentError) {
        platformStatus = 'not started';
      }
    }
    if (platformStatus === 'running' && tendermintStatus.result.sync_info.catching_up === true) {
      platformStatus = 'syncing';
    }

    // Build table
    rows.push(['Network', blockchainInfo.chain]);
    rows.push(['Masternode Status', masternodeStatus.status]);
    rows.push(['Core Version', networkInfo.subversion.replace(/\/|\(.*?\)/g, '')]);
    rows.push(['Core Status', coreStatus]);
    if (config.options.network !== 'testnet') {
      rows.push(['Platform Version', tendermintStatus.result.node_info.version]);
      rows.push(['Platform Status', platformStatus]);
    }
    if (masternodeStatus.state === 'READY') {
      rows.push(['PoSe Penalty', masternodeStatus.dmnState.PoSePenalty]);
      rows.push(['Last paid', masternodeStatus.dmnState.lastPaidHeight]);
    }

    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

StatusCommand.description = 'Show status overview';

StatusCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = StatusCommand;
