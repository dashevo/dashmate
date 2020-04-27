const Listr = require('listr');
const { Observable } = require('rxjs');

const { flags: flagTypes } = require('@oclif/command');

const { PrivateKey } = require('@dashevo/dashcore-lib');

const BaseCommand = require('../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../oclif/renderer/UpdateRendererWithOutput');

const PRESETS = require('../presets');

const MASTERNODE_DASH_AMOUNT = 1000;

class RegisterCommand extends BaseCommand {
  async runWithDependencies(
    {
      preset, port, 'private-key': privateKey, 'external-ip': externalIp,
    },
    {},
    startCore,
    createNewAddress,
    generateToAddress,
    generateBlocks,
    waitForCoreSync,
    importPrivateKey,
    getAddressBalance,
    generateBlsKeys,
    sendToAddress,
    waitForConfirmations,
    registerMasternode,
  ) {
    const network = 'testnet';
    const fundSourceAddress = new PrivateKey(
      privateKey,
      network,
    )
      .toAddress(network)
      .toString();

    const tasks = new Listr([
      {
        title: 'Start Core',
        task: async (ctx) => {
          ctx.coreService = await startCore(preset, { wallet: true });

          process.on('SIGINT', async () => {
            await ctx.coreService.stop();
            process.exit();
          });
        },
      },
      {
        title: 'Import private key',
        task: async (ctx) => importPrivateKey(ctx.coreService, ctx.privateKey),
      },
      {
        title: 'Sync Core with network',
        enabled: () => preset !== PRESETS.LOCAL,
        task: async (ctx) => waitForCoreSync(ctx.coreService),
      },
      {
        title: 'Check balance',
        task: async (ctx) => {
          const balance = await getAddressBalance(ctx.coreService, ctx.fundSourceAddress);
          if (balance <= MASTERNODE_DASH_AMOUNT) {
            throw new Error('You need to have more than 1000 Dash on your funding address');
          }
        },
      },
      {
        title: 'Generate BLS keys',
        task: async (ctx, task) => {
          ctx.bls = await generateBlsKeys();

          // eslint-disable-next-line no-param-reassign
          task.output = `Address: ${ctx.bls.address}\nPrivate key: ${ctx.bls.privateKey}`;
        },
      },
      {
        title: 'Generate collateral address',
        task: async (ctx, task) => {
          ctx.collateral = await createNewAddress(ctx.coreService);

          // eslint-disable-next-line no-param-reassign
          task.output = `Address: ${ctx.collateral.address}\nPrivate key: ${ctx.collateral.privateKey}`;
        },
      },
      {
        title: 'Generate owner addresses',
        task: async (ctx, task) => {
          ctx.owner = await createNewAddress(ctx.coreService);

          // eslint-disable-next-line no-param-reassign
          task.output = `Address: ${ctx.owner.address}\nPrivate key: ${ctx.owner.privateKey}`;
        },
      },
      {
        title: 'Send 1000 Dash to collateral address',
        task: async (ctx, task) => {
          ctx.tx = await sendToAddress();

          // eslint-disable-next-line no-param-reassign
          task.output = `Hash: ${ctx.tx}`;
        },
      },
      {
        title: 'Wait for 15 confirmations',
        enabled: () => preset !== PRESETS.LOCAL,
        task: async (ctx) => (
          new Observable(async (observer) => {
            await waitForConfirmations(
              ctx.coreService,
              ctx.tx,
              15,
              (confirmations) => {
                ctx.balance = confirmations;
                observer.next(`${confirmations} ${confirmations > 1 ? 'confirmation' : 'confirmations'}`);
              },
            );

            observer.complete();
          })
        ),
      },
      {
        title: 'Mine 15 blocks to confirm',
        enabled: () => preset === PRESETS.LOCAL,
        task: async (ctx) => (
          new Observable(async (observer) => {
            await generateBlocks(
              ctx.coreService,
              15,
              (blocks) => {
                observer.next(`${blocks} ${blocks > 1 ? 'blocks' : 'block'} mined`);
              },
            );

            observer.complete();
          })
        ),
      },
      {
        title: 'Reach 1000 blocks',
        enabled: () => preset === PRESETS.LOCAL,
        task: async (ctx) => {
          const { result: height } = ctx.coreService.getRpcClient().getBlockCount();

          if (height < 1000) {
            await new Observable(async (observer) => {
              await generateBlocks(
                ctx.coreService,
                1000 - height,
                (blocks) => {
                  observer.next(`${1000 - height - blocks} remaining`);
                },
              );

              observer.complete();
            });
          }
        },
      },
      {
        title: 'Register masternode',
        task: async (ctx, task) => {
          const tx = await registerMasternode();

          // eslint-disable-next-line no-param-reassign
          task.output = `Hash: ${tx}\nDon't forget to add bls private key to your configuration`;
        },
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    let context;

    try {
      context = await tasks.run({
        fundSourceAddress,
        privateKey,
        externalIp,
        port,
      });
    } catch (e) {
      context = e.context;
    } finally {
      if (context && context.coreService) {
        await context.coreService.stop();
      }
    }
  }
}

RegisterCommand.description = `Register masternode
...
Register masternode using predefined presets
`;

RegisterCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}, {
  name: 'private-key',
  required: true,
  description: 'private key with more than 1000 dash',
}, {
  name: 'external-ip',
  required: true,
  description: 'masternode external IP',
}, {
  name: 'port',
  required: true,
  description: 'masternode P2P port',
}];

module.exports = RegisterCommand;
