const { table } = require('table');
const chalk = require('chalk');

const BaseCommand = require('../../oclif/command/BaseCommand');
const CoreService = require('../../core/CoreService');

const ContainerIsNotPresentError = require('../../docker/errors/ContainerIsNotPresentError');

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

    if (config.options.core.masternode.enable === false) {
      // eslint-disable-next-line no-console
      console.log('This is not a masternode!');
      this.exit();
    }

    // Collect data
    const mnsyncStatus = (await coreService.getRpcClient().mnsync('status')).result;
    const blockchainInfo = (await coreService.getRpcClient().getBlockchainInfo()).result;
    const masternodeStatus = (await coreService.getRpcClient().masternode('status')).result;
    const masternodeCount = (await coreService.getRpcClient().masternode('count')).result;

    // Determine status
    let status;
    try {
      ({
        State: {
          Status: status,
        },
      } = await dockerCompose.inspectService(config.toEnvs(), 'core'));
    } catch (e) {
      if (e instanceof ContainerIsNotPresentError) {
        status = 'not started';
      }
    }
    if (status === 'running') {
      if (mnsyncStatus.AssetName !== 'MASTERNODE_SYNC_FINISHED') {
        status = `syncing ${(blockchainInfo.verificationprogress * 100).toFixed(2)}%`;
      }
    }

    let paymentQueuePosition;
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

    let sentinelState = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    )).out.split('\n')[0];

    // Apply colors
    if (status === 'running') {
      status = chalk.green(status);
    } else if (status.includes('syncing')) {
      status = chalk.yellow(status);
    } else {
      status = chalk.red(status);
    }

    if (sentinelState === '') {
      sentinelState = chalk.green('No errors');
    } else {
      sentinelState = chalk.red(sentinelState);
    }

    let PoSePenalty;
    if (masternodeStatus.dmnState.PoSePenalty === 0) {
      PoSePenalty = chalk.green(masternodeStatus.dmnState.PoSePenalty);
    } else {
      PoSePenalty = chalk.red(masternodeStatus.dmnState.PoSePenalty);
    }

    // Build table
    rows.push(['Masternode status', status]);
    rows.push(['Sentinel status', (sentinelState !== '' ? sentinelState : 'No errors')]);
    if (masternodeStatus.state === 'READY') {
      rows.push(['ProTx Hash', masternodeStatus.proTxHash]);
      rows.push(['PoSe Penalty', PoSePenalty]);
      rows.push(['Last paid', masternodeStatus.dmnState.lastPaidHeight]);
      rows.push(['Payment queue', `${paymentQueuePosition}/${masternodeCount.enabled}`]);
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
