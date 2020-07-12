const Listr = require('listr');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../oclif/command/BaseCommand');

const UpdateRendererWithOutput = require('../oclif/renderer/UpdateRendererWithOutput');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

class SSLObtainCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      'external-ip': externalIp,
      'zerossl-apikey': zerosslAPIKey,
    },    
  ) {
    const tasks = new Listr([
      {
        title: `Obtain ZeroSSL cert for ip ${externalIp}`,
        task: async () => {
          
        },
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    try {
      await tasks.run();
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

SSLObtainCommand.description = `Obtain SSL Cert
...
Obtain SSL Cert using ZeroSLL API Key
`;

SSLObtainCommand.args = [{
  name: 'external-ip',
  required: true,
  description: 'masternode external IP',
}, {
  name: 'zerossl-apikey',
  required: true,
  description: 'ZeroSSL API Key - https://app.zerossl.com/developer',
}];

module.exports = SSLObtainCommand;