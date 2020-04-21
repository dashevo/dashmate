const { Command } = require('@oclif/command');
const registerMasternode = require('../../lib/commands/registerMasternode');

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
