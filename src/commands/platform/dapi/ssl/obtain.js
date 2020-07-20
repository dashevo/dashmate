const execa = require('execa');
const fs = require('fs');
const { Listr } = require('listr2');
const { Observable } = require('rxjs');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

const createCertificate = require('../../../../ssl/zerossl/createCertificate');
const downloadCertificate = require('../../../../ssl/zerossl/downloadCertificate');
const verifyDomain = require('../../../../ssl/zerossl/verifyDomain');
const verifyTempServer = require('../../../../ssl/zerossl/verifyTempServer');

const PRESETS = require('../../../../presets');

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
    },
  ) {
    const tasks = new Listr([
      {
        title: `Create ZeroSSL cert for ip ${externalIp}`,
        task: async (ctx, task) => {
          try {
            const csr = fs.readFileSync(`./configs/${preset}/dapi/nginx/domain.csr`, 'utf8');
            const response = await createCertificate(zerosslAPIKey, externalIp, csr);

            if ('error' in response.data) {
              throw new Error(error);
            } else {
              ctx.certId = response.data.id;
              // eslint-disable-next-line max-len
              const url = response.data.validation.other_methods[externalIp].file_validation_url_http;
              ctx.fileName = url.replace(`http://${externalIp}/.well-known/pki-validation/`, '');
              let fileContent = '';

              for (let index = 0; index < 3; index++) {
                // eslint-disable-next-line max-len
                fileContent += response.data.validation.other_methods[externalIp].file_validation_content[index];
                if (index < 2) {
                  fileContent += '\n';
                }
              }

              const validationPath = './src/commands/platform/dapi/ssl/.well-known/pki-validation/';
              if (!fs.existsSync(validationPath)) {
                fs.mkdirSync(validationPath, { recursive: true });
              }

              fs.writeFileSync(validationPath + ctx.fileName,fileContent,(err) => {
                if (err) { throw err; }
              });

              // eslint-disable-next-line no-param-reassign
              task.output = `Challenge saved: /src/commands/platform/dapi/ssl/.well-known/pki-validation/${ctx.fileName}`;
            }
          } catch (error) {
            throw new Error(error);
          }
        },
      },
      {
        title: 'Setup temp server to verify IP',
        task: async (ctx, task) => {
          ctx.server = execa('http-server', ['src/commands/platform/dapi/ssl/', '-p 80']);
          // eslint-disable-next-line no-param-reassign
          task.output = `Server ${ctx.server.stdout}`;
        },
      },
      {
        title: 'Test temp server',
        task: async (ctx) => new Observable(async (observer) => {
          const serverURL = `http://${externalIp}/.well-known/pki-validation/${ctx.fileName}`;
          setTimeout(async () => {
            observer.next('Wait for server');
            await verifyTempServer(serverURL);
            observer.complete();
          }, 2000);
        }),
      },
      {
        title: 'Verify IP',
        task: async (ctx) => {
          try {
            await verifyDomain(ctx.certId, zerosslAPIKey);
          } catch (error) {
            throw new Error(error);
          }
        },
      },
      {
        title: 'Download Certificate',
        task: async (ctx, task) => {
          try {
            var response = await downloadCertificate(ctx.certId,zerosslAPIKey);
            var bundleFile = './configs/' + preset + '/dapi/nginx/bundle.crt';
            
            while ('error' in response.data){
              response = await downloadCertificate(ctx.certId,zerosslAPIKey);
            }

            fs.writeFile(bundleFile,response.data['certificate.crt'] + '\n' + response.data['ca_bundle.crt'],(err) => {
              if (err) throw err;        
            });

            ctx.server.kill('SIGTERM', {
              forceKillAfterTimeout: 2000
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
    {
      rendererOptions: {
        clearOutput: false,
        collapse: false,
        showSubtasks: true,
      },
    });

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