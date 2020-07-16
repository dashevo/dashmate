const Listr = require('listr');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../../../oclif/renderer/UpdateRendererWithOutput');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

var createCertificate = require('../../../../ssl/zerossl/createCertificate');

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
    }    
  ) {
    const tasks = new Listr([
      {
        title: `Obtain ZeroSSL cert for ip ${externalIp}`,
        task: async (ctx, task) => {          
          try {
            var response = await createCertificate(zerosslAPIKey, externalIp);  
          } catch (error) {
            throw new Error(error);
          }

          var url = response.data['validation']['other_methods'][externalIp]['file_validation_url_http'];
          var fileLine1 = response.data['validation']['other_methods'][externalIp]['file_validation_content'][0];
          var fileLine2 = response.data['validation']['other_methods'][externalIp]['file_validation_content'][1];
          var fileLine3 = response.data['validation']['other_methods'][externalIp]['file_validation_content'][2];
          // eslint-disable-next-line no-param-reassign
          task.output = `URL: ${url}`                
        },    
      },
      {
        title: 'Success',
        task: () => 'Foo'
      },
      {
        title: 'Failure',
        task: () => {
          throw new Error('Bar')
        }
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