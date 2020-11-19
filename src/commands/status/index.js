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

    const serviceHumanNames = {
      core: 'Core Status',
    };

    if (config.options.network !== 'testnet') {
      Object.assign(serviceHumanNames, {
        drive_tendermint: 'Tenderdash Status',
      });
    }

    for (const [serviceName, serviceDescription] of Object.entries(serviceHumanNames)) {
      let status;

      try {
        ({
          State: {
            Status: status,
          },
        } = await dockerCompose.inspectService(config.toEnvs(), serviceName));
      } catch (e) {
        if (e instanceof ContainerIsNotPresentError) {
          status = 'not started';
        }
      }

      rows.push([
        serviceDescription,
        status,
      ]);
    }

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

    // Network data
    const networkStatus = (await coreService.getRpcClient().getNetworkInfo()).result;

    // Network data
    const blockchainStatus = (await coreService.getRpcClient().getBlockchainInfo()).result;

    // Masternode data
    const masternodeStatus = (await coreService.getRpcClient().masternode('status')).result;

    // Platform status
    let tendermintStatus;
    if (config.options.network !== 'testnet') {
      // curl fails if tendermint has not started yet because abci is waiting for core to sync
      if (mnsyncStatus.IsSynced === true) {
        tendermintStatus = JSON.parse(await fetch(`http://localhost:${config.options.platform.drive.tendermint.rpc.port}/status`).then((res) => res.text()));
      }
    }

    // Build table
    rows.push(['Network', blockchainStatus.chain]);
    rows.push(['Masternode Status', masternodeStatus.status]);
    rows.push(['Core Version', networkStatus.subversion.replace(/\/|\(.*?\)/g, '')]);
    rows.push(['Core Status', mnsyncStatus.AssetName]);
    if (config.options.network !== 'testnet') {
      rows.push(['Platform Version', tendermintStatus.result.node_info.version]);
      rows.push(['Platform Status', '-']);
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
