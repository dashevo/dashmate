const { Command, flags: flagTypes } = require('@oclif/command');
const { cli } = require('cli-ux');
const compose = require('docker-compose');
const Docker = require('dockerode');
const RpcClient = require('@dashevo/dashd-rpc/promise');
const generateToAddressFactory = require('../../core/wallet/generateToAddressFactory');
const waitForCoreStartFactory = require('../../core/waitForCoreStartFactory');
const waitForCoreSyncFactory = require('../../core/waitForCoreSyncFactory');

const wait = require('../../util/wait');

class GenerateToAddressCommand extends Command {
  async run() {
    const { flags, args } = this.parse(GenerateToAddressCommand);
    const { address } = flags;
    const { preset, amount } = args;
    this.log(`Starting to generate new address with ${amount} dash using preset ${preset} and address ${address || 'new'}`);

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

    const generateToAddress = generateToAddressFactory(
      logger,
      docker,
      compose,
      coreClient,
      waitForCoreStart,
      waitForCoreSync,
    );

    await generateToAddress(preset, amount, address);
  }
}

GenerateToAddressCommand.description = `Generate new address
...
Generate new address with defined amount of dash
`;

GenerateToAddressCommand.flags = {
  address: flagTypes.string({ char: 'a', description: 'amount of dash to be generated to new address', default: null }),
};

GenerateToAddressCommand.args = [{
  name: 'preset',
  required: true,
  description: '-preset to use',
  options: [
    'evonet',
    'local',
  ],
}, {
  name: 'amount',
  required: true,
  description: '-amount of dash to be generated to new address',
  parse: (input) => parseInt(input, 10),
}];

module.exports = GenerateToAddressCommand;
