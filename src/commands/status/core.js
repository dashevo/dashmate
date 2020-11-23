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

    const insightURLs = {
      evonet: 'http://insight.evonet.networks.dash.org:3001/insight-api',
      testnet: 'https://testnet-insight.dashevo.org/insight-api',
      mainnet: 'https://insight.dash.org/insight-api',
    };

    // Collect data
    const { result: blockchainInfo } = await coreService.getRpcClient().getBlockchainInfo();
    const { result: networkInfo } = await coreService.getRpcClient().getNetworkInfo();
    const { result: mnsyncStatus } = await coreService.getRpcClient().mnsync('status');
    const { result: peerInfo } = await coreService.getRpcClient().getPeerInfo();
    const latestVersionRes = await fetch('https://api.github.com/repos/dashpay/dash/releases/latest');
    const latestVersion = await latestVersionRes.json();
    const insightBlockHeightRes = await fetch(`${insightURLs[config.options.network]}/status`);
    const insightBlockHeight = await insightBlockHeightRes.json();
    const corePortStateRes = await fetch(`https://mnowatch.org/${config.options.core.p2p.port}/`);
    let corePortState = await corePortStateRes.text();
    let coreVersion = networkInfo.subversion.replace(/\/|\(.*?\)/g, '');
    const sentinelVersion = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py -v',
    )).out.split('\n')[0];
    let sentinelState = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    )).out.split('\n')[0];

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

    // Apply colors
    if (status === 'running') {
      status = chalk.green(status);
    } else if (status.includes('syncing')) {
      status = chalk.yellow(status);
    } else {
      status = chalk.red(status);
    }

    if (coreVersion.substring(coreVersion.indexOf(':') + 1) === latestVersion.tag_name.substring(1)) {
      coreVersion = chalk.green(coreVersion);
    } else {
      coreVersion = chalk.red(coreVersion);
    }

    if (corePortState === 'OPEN') {
      corePortState = chalk.green(corePortState);
    } else {
      corePortState = chalk.red(corePortState);
    }

    let blocks;
    if (blockchainInfo.blocks === blockchainInfo.headers
      || blockchainInfo.blocks >= insightBlockHeight.info.blocks) {
      blocks = chalk.green(blockchainInfo.blocks);
    } else {
      blocks = chalk.red(blockchainInfo.blocks);
    }

    if (sentinelState === '') {
      sentinelState = chalk.green('No errors');
    } else {
      sentinelState = chalk.red(sentinelState);
    }

    // Build table
    rows.push(['Version', coreVersion]);
    rows.push(['Latest version', latestVersion.tag_name]);
    rows.push(['Network', blockchainInfo.chain]);
    rows.push(['Status', status]);
    rows.push(['Sync asset', mnsyncStatus.AssetName]);
    rows.push(['Peer count', peerInfo.length]);
    rows.push(['P2P service', `${config.options.externalIp}:${config.options.core.p2p.port}`]);
    rows.push(['P2P port', `${config.options.core.p2p.port} ${corePortState}`]);
    rows.push(['RPC service', `127.0.0.1:${config.options.core.rpc.port}`]);
    rows.push(['Block height', blocks]);
    rows.push(['Header height', blockchainInfo.headers]);
    rows.push(['Remote block height', insightBlockHeight.info.blocks]);
    rows.push(['Difficulty', blockchainInfo.difficulty]);
    rows.push(['Sentinel version', sentinelVersion]);
    rows.push(['Sentinel status', (sentinelState)]);

    const output = table(rows, { singleLine: true });

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

CoreStatusCommand.description = 'Show core status details';

CoreStatusCommand.flags = {
  ...BaseCommand.flags,
};

module.exports = CoreStatusCommand;
