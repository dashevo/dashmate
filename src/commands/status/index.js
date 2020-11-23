const { table } = require('table');
const fetch = require('node-fetch');
const chalk = require('chalk');

const ContainerIsNotPresentError = require('../../docker/errors/ContainerIsNotPresentError');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');
const blocksToTime = require('../../util/blocksToTime');

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
    const { result: mnsyncStatus } = await coreService.getRpcClient().mnsync('status');
    const { result: networkInfo } = await coreService.getRpcClient().getNetworkInfo();
    const { result: blockchainInfo } = await coreService.getRpcClient().getBlockchainInfo();

    let masternodeStatus;
    let masternodeCount;
    if (config.options.core.masternode.enable === true) {
      ({ result: masternodeStatus } = await coreService.getRpcClient().masternode('status'));
      ({ result: masternodeCount } = await coreService.getRpcClient().masternode('count'));
    }

    // Platform status
    let tendermintStatus;
    if (config.options.network !== 'testnet') {
      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        const tendermintStatusRes = await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`);
        tendermintStatus = await tendermintStatusRes.json();
      }
    }
    const explorerBlockHeightRes = await fetch('https://rpc.cloudwheels.net:26657/status');
    const explorerBlockHeight = await explorerBlockHeightRes.json();

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
    if (platformStatus === 'running' && mnsyncStatus.IsSynced === false) {
      platformStatus = 'waiting for core sync';
    } else if (platformStatus === 'running' && tendermintStatus.result.sync_info.catching_up === true) {
      platformStatus = `syncing ${((tendermintStatus.result.sync_info.latest_block_height
        / explorerBlockHeight.result.sync_info.latest_block_height)
        * 100).toFixed(2)}%`;
    }

    let paymentQueuePosition;
    if (config.options.core.masternode.enable === true) {
      if (masternodeStatus.state === 'READY') {
        if (masternodeStatus.dmnState.PoSeRevivedHeight > 0) {
          paymentQueuePosition = masternodeStatus.dmnState.PoSeRevivedHeight
            + masternodeCount.enabled
            - blockchainInfo.blocks;
        } else if (masternodeStatus.dmnState.lastPaidHeight === 0) {
          paymentQueuePosition = masternodeStatus.dmnState.registeredHeight
            + masternodeCount.enabled
            - blockchainInfo.blocks;
        } else {
          paymentQueuePosition = masternodeStatus.dmnState.lastPaidHeight
            + masternodeCount.enabled
            - blockchainInfo.blocks;
        }
      }
    }

    // Apply colors
    if (coreStatus === 'running') {
      coreStatus = chalk.keyword('green')(coreStatus);
    } else if (coreStatus.includes('syncing')) {
      coreStatus = chalk.keyword('yellow')(coreStatus);
    } else {
      coreStatus = chalk.keyword('red')(coreStatus);
    }

    if (platformStatus === 'running') {
      platformStatus = chalk.keyword('green')(platformStatus);
    } else if (platformStatus.includes('syncing')) {
      platformStatus = chalk.keyword('yellow')(platformStatus);
    } else {
      platformStatus = chalk.keyword('red')(platformStatus);
    }

    // Build table
    rows.push(['Network', blockchainInfo.chain]);
    rows.push(['Core Version', networkInfo.subversion.replace(/\/|\(.*?\)/g, '')]);
    rows.push(['Core Status', coreStatus]);
    if (config.options.core.masternode.enable === true) {
      rows.push(['Masternode Status', chalk.keyword(masternodeStatus.status === 'Ready' ? 'green' : 'red')(masternodeStatus.status)]);
    }
    if (config.options.network !== 'testnet' && mnsyncStatus.IsSynced === true) {
      rows.push(['Platform Version', tendermintStatus.result.node_info.version]);
    }
    rows.push(['Platform Status', platformStatus]);
    if (config.options.core.masternode.enable === true) {
      if (masternodeStatus.state === 'READY') {
        rows.push(['PoSe Penalty', masternodeStatus.dmnState.PoSePenalty]);
        rows.push(['Last paid block', masternodeStatus.dmnState.lastPaidHeight]);
        rows.push(['Last paid time', `${blocksToTime(blockchainInfo.blocks - masternodeStatus.dmnState.lastPaidHeight)} ago`]);
        rows.push(['Payment queue position', `${paymentQueuePosition}/${masternodeCount.enabled}`]);
        rows.push(['Next payment time', `in ${blocksToTime(paymentQueuePosition)}`]);
      }
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
