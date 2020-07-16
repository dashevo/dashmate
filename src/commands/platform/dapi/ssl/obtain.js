const Listr = require('listr');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../../../oclif/renderer/UpdateRendererWithOutput');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

class ObtainCommand extends BaseCommand {
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
    createCertificate,    
  ) {
    const tasks = new Listr([
      {
        title: `Obtain ZeroSSL cert for ip ${externalIp}`,
        task: async () => {
          new Listr([
            {
              title: 'Create Certificate',
              task: async (ctx, task) => {
                try {
                  ctx.JSONCert = await createCertificate(ctx.zerosslAPIKey, ctx.externalIp);  
                } catch (error) {
                  throw new Error(error);
                }
                
                // eslint-disable-next-line no-param-reassign
                task.output = `Result: ${ctx.JSONCert}`
              },              
            },
          ])        
        },
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    try {
      await tasks.run(
        externalIp,
        zerosslAPIKey
      );
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

ObtainCommand.description = `Obtain SSL Cert
...
Obtain SSL Cert using ZeroSLL API Key
`;

ObtainCommand.args = [{
  name: 'external-ip',
  required: true,
  description: 'masternode external IP',
}, {
  name: 'zerossl-apikey',
  required: true,
  description: 'ZeroSSL API Key - https://app.zerossl.com/developer',
}];

module.exports = ObtainCommand;