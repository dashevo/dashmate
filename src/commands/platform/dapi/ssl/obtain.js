const Listr = require('listr');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../../../oclif/renderer/UpdateRendererWithOutput');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

var createCertificate = require('../../../../ssl/zerossl/createCertificate');
var downloadCertificate = require('../../../../ssl/zerossl/downloadCertificate');
var listCertificate = require('../../../../ssl/zerossl/listCertificates');
var verifyDomain = require('../../../../ssl/zerossl/verifyDomain');
var fs = require('fs')

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
        title: `Create ZeroSSL cert for ip ${externalIp}`,
        task: async (ctx, task) => {          
          try {
            var response = await createCertificate(zerosslAPIKey, externalIp);  
          } catch (error) {
            throw new Error(error);
          }

          var url = response.data['validation']['other_methods'][externalIp]['file_validation_url_http'];
          var fileName = url.replace('http://' + externalIp + '/.well-known/pki-validation/', '');
          var fileContent = '';

          for (let index = 0; index < 3; index++) {
            fileContent = fileContent + response.data['validation']['other_methods'][externalIp]['file_validation_content'][index];
            if(index < 2){
              fileContent = fileContent + '\n';
            }
          }          

          fs.writeFile('./src/commands/platform/dapi/ssl/' + fileName,fileContent,(err) => {
            if (err) throw err;        
          });

          // eslint-disable-next-line no-param-reassign
          task.output = `Challenge saved: /src/commands/platform/dapi/ssl/${fileName}`                
        },    
      },
      {
        title: 'Validate IP',
        task: () => 'Foo'
        //TODO: setup a server with file challenge
      },
      {
        title: 'Download Certificate',
        task: async (ctx, task) => {
          try {
            var response = await downloadCertificate('895f4b26cd87a851f7748a39b486b5be',zerosslAPIKey);
            fs.writeFile('./configs/evonet/dapi/nginx/bundle.crt',response.data['certificate.crt'] + '\n' + response.data['ca_bundle.crt'],(err) => {
              if (err) throw err;        
            });  

          } catch (error) {
            throw new Error(error);
          }
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