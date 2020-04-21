const { Command, flags: flagTypes } = require('@oclif/command');
const getNewAddress = require('../../../lib/commands/getNewAddress');

class GetNewAddressCommand extends Command {
  async run() {
    const { flags, args } = this.parse(GetNewAddressCommand);
    const { amount } = flags;
    const { preset } = args;
    this.log(`Starting to generate new address with ${amount} dash using preset ${preset}`);

    await getNewAddress(preset, amount);
  }
}

GetNewAddressCommand.description = `Generate new address
...
Generate new address with defined amount of dash
`;

GetNewAddressCommand.flags = {
  amount: flagTypes.integer({ char: 'a', description: 'amount of dash to be generated to new address', default: 0 }),
};

GetNewAddressCommand.args = [{
  name: 'preset',
  required: true,
  description: '-preset to use',
  options: [
    'evonet',
    'local',
    'testnet',
  ],
}];

module.exports = GetNewAddressCommand;
