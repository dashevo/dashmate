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

    // Network data
    const blockchainInfo = (await coreService.getRpcClient().getBlockchainInfo()).result;
    const networkInfo = (await coreService.getRpcClient().getNetworkInfo()).result;
    const mnsyncStatus = (await coreService.getRpcClient().mnsync('status')).result;
    const peerInfo = (await coreService.getRpcClient().getPeerInfo()).result;
    const latestVersion = JSON.parse(await fetch('https://api.github.com/repos/dashpay/dash/releases/latest').then((res) => res.text()));
    const corePortState = await fetch(`https://mnowatch.org/${config.options.core.p2p.port}/`).then((res) => res.text());
    const SentinelVersion = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py -v',
    )).out.split('\n')[0];
    const sentinelState = (await dockerCompose.execCommand(
      config.toEnvs(),
      'sentinel',
      'python bin/sentinel.py',
    )).out.split('\n')[0];

    // Build table
    rows.push(['Version', networkInfo.subversion.replace(/\/|\(.*?\)/g, '')]);
    rows.push(['Latest version', latestVersion.tag_name]);
    rows.push(['Network', blockchainInfo.chain]);
    rows.push(['Status', '-']);
    rows.push(['Sync asset', mnsyncStatus.AssetName]);
    rows.push(['Peer count', peerInfo.length]);
    rows.push(['P2P service', `${config.options.externalIp}:${config.options.core.p2p.port}`]);
    rows.push(['P2P port', `${config.options.core.p2p.port} ${corePortState}`]);
    rows.push(['RPC service', `127.0.0.1:${config.options.core.rpc.port}`]);
    rows.push(['Header height', blockchainInfo.headers]);
    rows.push(['Block height', blockchainInfo.blocks]);
    rows.push(['Remote block height', '-']);
    rows.push(['Difficulty', blockchainInfo.difficulty]);
    rows.push(['Sentinel version', SentinelVersion]);
    rows.push(['Sentinel status', sentinelState]);

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
