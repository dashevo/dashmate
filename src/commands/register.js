const { Command } = require('@oclif/command');
const compose = require('docker-compose');
const Docker = require('dockerode');
const RpcClient = require('@dashevo/dashd-rpc/promise');

const registerMasternodeFactory = require('../core/mn/registerMasternodeFactory');
const waitForCoreSyncFactory = require('../core/waitForCoreSync');
const waitForCoreStartFactory = require('../core/waitForCoreStart');
const getInputsForAmountFactory = require('../core/wallet/getInputsForAmountFactory');
const waitForConfirmationsFactory = require('../core/waitForConfirmationsFactory');

class RegisterCommand extends Command {
  async run() {
    const { args } = this.parse(RegisterCommand);
    const {
      preset,
      'private-key': privateKey,
      'external-ip': externalIp,
      port,
    } = args;
    this.log(`Starting to register masternode using preset ${preset}`);

    const logger = {
      log: this.log.bind(this),
      info: this.log.bind(this),
      warn: this.warn.bind(this),
      error: this.error.bind(this),
    };

    const docker = new Docker();

    const dashcoreConfig = {
      protocol: 'http',
      user: 'dashrpc',
      pass: 'password',
      host: '127.0.0.1',
      port: 20002,
    };

    const coreClient = new RpcClient(dashcoreConfig);
    const waitForCoreStart = waitForCoreStartFactory(logger, coreClient);
    const waitForCoreSync = waitForCoreSyncFactory(logger, coreClient);
    const waitForConfirmations = waitForConfirmationsFactory(logger, coreClient);
    const getInputsForAmount = getInputsForAmountFactory(coreClient);

    const registerMasternode = registerMasternodeFactory(
      logger,
      docker,
      compose,
      coreClient,
      waitForCoreStart,
      waitForCoreSync,
      waitForConfirmations,
      getInputsForAmount,
    );

    await registerMasternode(preset, privateKey, externalIp, port);
  }
}

RegisterCommand.description = `Register masternode
...
Register masternode using predefined presets
`;

RegisterCommand.args = [{
  name: 'preset',
  required: true,
  description: '-preset to use',
  options: [
    'evonet',
    'local',
    'testnet',
  ],
}, {
  name: 'private-key',
  required: true,
  description: '-private key with more than 1000 dash',
}, {
  name: 'external-ip',
  required: true,
  description: '-masternode external IP',
}, {
  name: 'port',
  required: true,
  description: '-masternode P2P port',
}];

module.exports = RegisterCommand;
