const execa = require('execa');
const fs = require('fs');
const { Listr } = require('listr2');
const { Observable } = require('rxjs');

const BaseCommand = require('../../../../oclif/command/BaseCommand');
const MuteOneLineError = require('../../../../oclif/errors/MuteOneLineError');

const listCertificate = require('../../../../ssl/zerossl/listCertificates');
const downloadCertificate = require('../../../../ssl/zerossl/downloadCertificate');
const verifyDomain = require('../../../../ssl/zerossl/verifyDomain');
const verifyTempServer = require('../../../../ssl/zerossl/verifyTempServer');

const PRESETS = require('../../../../presets');

class RenewCommand extends BaseCommand {
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
        title: `Search ZeroSSL cert for ip ${externalIp}`,
        task: async (ctx, task) => {
          try {
            const response = await listCertificate(zerosslAPIKey);

            if ('error' in response.data) {
              throw new Error(response.data.error.type);
            } else {
              for (const result in response.data.results) {
                if (response.data.results[result].common_name === externalIp) {
                  ctx.certId = response.data.results[result].id;
                }
              }

              // eslint-disable-next-line no-param-reassign
              task.output = `Cert found: ${ctx.certId}`;
            }
          } catch (error) {
            throw new Error(error);
          }
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Setup temp server to verify IP',
        task: async (ctx, task) => {
          ctx.server = execa('http-server', ['src/commands/platform/dapi/ssl/', '-p 80']);
          // eslint-disable-next-line no-param-reassign
          task.output = `Server ${ctx.server.stdout}`;
        },
        options: { persistentOutput: true },
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
            let response = await downloadCertificate(ctx.certId, zerosslAPIKey);
            const bundleFile = `./configs/${preset}/dapi/nginx/bundle.crt`;

            while ('error' in response.data) {
              response = await downloadCertificate(ctx.certId, zerosslAPIKey);
            }

            fs.writeFile(bundleFile, `${response.data['certificate.crt']}\n${response.data['ca_bundle.crt']}`, (err) => {
              if (err) { throw err; }
            });

            ctx.server.kill('SIGTERM', {
              forceKillAfterTimeout: 2000,
            });

            const privateKeyFile = `./configs/${preset}/dapi/nginx/private.key`;
            try {
              if (fs.existsSync(bundleFile) && fs.existsSync(privateKeyFile)) {
                // eslint-disable-next-line no-param-reassign
                task.output = `Cert files updated: \n ${bundleFile} \n ${privateKeyFile}`;
              }
            } catch (err) {
              throw new Error(err);
            }
          } catch (error) {
            throw new Error(error);
          }
        },
        options: { persistentOutput: true },
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
        zerosslAPIKey,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

RenewCommand.description = `Renew SSL Cert
...
Renew SSL Cert using ZeroSLL API Key
`;

RenewCommand.args = [{
  name: 'preset',
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

module.exports = RenewCommand;
