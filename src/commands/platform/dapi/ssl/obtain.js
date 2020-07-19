const execa = require('execa');
const Listr = require('listr');
const { Observable } = require('rxjs');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../../../oclif/renderer/UpdateRendererWithOutput');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

var createCertificate = require('../../../../ssl/zerossl/createCertificate');
var downloadCertificate = require('../../../../ssl/zerossl/downloadCertificate');
var verifyDomain = require('../../../../ssl/zerossl/verifyDomain');
var verifyTempServer = require('../../../../ssl/zerossl/verifyTempServer');
var fs = require('fs')

const PRESETS = require('../../../../presets');
const { Http2ServerRequest } = require('http2');

class ObtainCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
      'external-ip': externalIp,
      'zerossl-apikey': zerosslAPIKey,
    }    
  ) {
    const tasks = new Listr([
      {
        title: `Create ZeroSSL cert for ip ${externalIp}`,
        task: async (ctx, task) => {          
          try {
            var csr = '';
            csr = fs.readFileSync('./configs/' + preset + '/dapi/nginx/domain.csr', 'utf8'); 
            var response = await createCertificate(zerosslAPIKey, externalIp, csr);  
          } catch (error) {
            throw new Error(error);
          }
          ctx.certId = response.data['id'];
          var url = response.data['validation']['other_methods'][externalIp]['file_validation_url_http'];
          ctx.fileName = url.replace('http://' + externalIp + '/.well-known/pki-validation/', '');
          var fileContent = '';

          for (let index = 0; index < 3; index++) {
            fileContent = fileContent + response.data['validation']['other_methods'][externalIp]['file_validation_content'][index];
            if(index < 2){
              fileContent = fileContent + '\n';
            }
          }          

          var validationPath = './src/commands/platform/dapi/ssl/.well-known/pki-validation/';
          if (!fs.existsSync(validationPath)) {
            fs.mkdirSync(validationPath, { recursive: true });
          }
          
          fs.writeFileSync(validationPath + ctx.fileName,fileContent,(err) => {
            if (err) throw err;        
          });

          // eslint-disable-next-line no-param-reassign
          task.output = `Challenge saved: /src/commands/platform/dapi/ssl/.well-known/pki-validation/${ctx.fileName}`;                
        },    
      },
      {
        title: 'Setup temp server to verify IP',
        task: async (ctx, task) => {
          ctx.server = execa('http-server', ['src/commands/platform/dapi/ssl/', '-p 80']);          
          task.output = `Server ${ctx.server.stdout}`;
        }
      },
      {
        title: 'Test temp server',
        task: async (ctx) => {
          return new Observable(async (observer) => {
            var serverURL = 'http://' + externalIp + '/.well-known/pki-validation/' + ctx.fileName;            
    
            setTimeout( async () => {
              observer.next('Wait for server');
              await verifyTempServer(serverURL);
              observer.complete();
            }, 2000);

          });
        }
      },
      {
        title: 'Verify IP',
        task: async (ctx, task) => {
          try {
            var response = await verifyDomain(ctx.certId,zerosslAPIKey);
          } catch (error) {
            throw new Error(error);
          }
          
        }
      },
      {
        title: 'Download Certificate',
        task: async (ctx, task) => {
          try {
            var response = await downloadCertificate(ctx.certId,zerosslAPIKey);
            var bundleFile = './configs/' + preset + '/dapi/nginx/bundle.crt';
            
            while (response.data['certificate.crt'] === 'undefined'){
              response = await downloadCertificate(ctx.certId,zerosslAPIKey);
            }
            
            fs.writeFile(bundleFile,response.data['certificate.crt'] + '\n' + response.data['ca_bundle.crt'],(err) => {
              if (err) throw err;        
            });
            
            var privateKeyFile = './configs/' + preset + '/dapi/nginx/private.key';
            try {
              if (fs.existsSync(bundleFile) && fs.existsSync(privateKeyFile)) {
                task.output = `Cert files generated: \n ${bundleFile} \n ${privateKeyFile}`;
              }
            } catch(err) {
              throw new Error(err);
            }

          } catch (error) {
            throw new Error(error);
          }
        }
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    try {
      await tasks.run({
        externalIp,
        zerosslAPIKey
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

ObtainCommand.description = `Obtain SSL Cert
...
Obtain SSL Cert using ZeroSLL API Key
`;

ObtainCommand.args = [{name: 'preset',
required: true,
description: 'preset to use',
options: Object.values(PRESETS),
}, {
  name: 'external-ip',
  required: true,
  description: 'masternode external IP',
}, {
  name: 'zerossl-apikey',
  required: true,
  description: 'ZeroSSL API Key - https://app.zerossl.com/developer',
}];

module.exports = ObtainCommand;