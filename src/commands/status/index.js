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
    const {
      result: {
        subversion: coreVersion,
      },
    } = await coreService.getRpcClient().getNetworkInfo();
    const {
      result: {
        blocks: coreBlocks,
        chain: coreChain,
        verificationprogress: coreVerificationProgress,
      },
    } = await coreService.getRpcClient().getBlockchainInfo();

    let masternodeStatus;
    let masternodePoSeRevivedHeight;
    let masternodeLastPaidHeight;
    let masternodeRegisteredHeight;
    let masternodeEnabledCount;
    let masternodePoSePenalty;
    if (config.options.core.masternode.enable === true) {
      ({
        result: {
          dmnState: {
            lastPaidHeight: masternodeLastPaidHeight,
            registeredHeight: masternodeRegisteredHeight,
            PoSeRevivedHeight: masternodePoSeRevivedHeight,
            PoSePenalty: masternodePoSePenalty,
          },
          status: masternodeStatus,
        },
      } = await coreService.getRpcClient().masternode('status'));
      ({
        result: {
          enabled: masternodeEnabledCount,
        },
      } = await coreService.getRpcClient().masternode('count'));
    }

    // Platform status
    let tendermintVersion;
    let tendermintBlockHeight;
    let tendermintCatchingUp;
    if (config.options.network !== 'testnet') {
      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        const tendermintStatusRes = await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`);
        ({
          result: {
            node_info: {
              version: tendermintVersion,
            },
            sync_info: {
              latest_block_height: tendermintBlockHeight,
              catching_up: tendermintCatchingUp,
            },
          },
        } = await tendermintStatusRes.json());
      }
    }
    const explorerBlockHeightRes = await fetch('https://rpc.cloudwheels.net:26657/status');
    const {
      result: {
        sync_info: {
          latest_block_height: explorerBlockHeight,
        },
      },
    } = await explorerBlockHeightRes.json();

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
        coreStatus = `syncing ${(coreVerificationProgress * 100).toFixed(2)}%`;
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
    } else if (platformStatus === 'running' && tendermintCatchingUp === true) {
      platformStatus = `syncing ${((tendermintBlockHeight / explorerBlockHeight) * 100).toFixed(2)}%`;
    }

    let paymentQueuePosition;
    if (config.options.core.masternode.enable === true) {
      if (masternodeStatus === 'Ready') {
        if (masternodePoSeRevivedHeight > 0) {
          paymentQueuePosition = masternodePoSeRevivedHeight
            + masternodeEnabledCount
            - coreBlocks;
        } else if (masternodeLastPaidHeight === 0) {
          paymentQueuePosition = masternodeRegisteredHeight
            + masternodeEnabledCount
            - coreBlocks;
        } else {
          paymentQueuePosition = masternodeLastPaidHeight
            + masternodeEnabledCount
            - coreBlocks;
        }
      }
    }

    // Apply colors
    if (coreStatus === 'running') {
      coreStatus = chalk.green(coreStatus);
    } else if (coreStatus.includes('syncing')) {
      coreStatus = chalk.yellow(coreStatus);
    } else {
      coreStatus = chalk.red(coreStatus);
    }

    if (platformStatus === 'running') {
      platformStatus = chalk.green(platformStatus);
    } else if (platformStatus.includes('syncing')) {
      platformStatus = chalk.yellow(platformStatus);
    } else {
      platformStatus = chalk.red(platformStatus);
    }

    // Build table
    rows.push(['Network', coreChain]);
    rows.push(['Core Version', coreVersion.replace(/\/|\(.*?\)/g, '')]);
    rows.push(['Core Status', coreStatus]);
    if (config.options.core.masternode.enable === true) {
      rows.push(['Masternode Status', (masternodeStatus === 'Ready' ? chalk.green : chalk.red)(masternodeStatus)]);
    }
    if (config.options.network !== 'testnet' && mnsyncStatus.IsSynced === true) {
      rows.push(['Platform Version', tendermintVersion]);
    }
    rows.push(['Platform Status', platformStatus]);
    if (config.options.core.masternode.enable === true) {
      if (masternodeStatus === 'Ready') {
        rows.push(['PoSe Penalty', masternodePoSePenalty]);
        rows.push(['Last paid block', masternodeLastPaidHeight]);
        rows.push(['Last paid time', `${blocksToTime(coreBlocks - masternodeLastPaidHeight)} ago`]);
        rows.push(['Payment queue position', `${paymentQueuePosition}/${masternodeEnabledCount}`]);
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
