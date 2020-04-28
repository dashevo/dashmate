const Listr = require('listr');
const { Observable } = require('rxjs');

const { PrivateKey } = require('@dashevo/dashcore-lib');

const BaseCommand = require('../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../oclif/renderer/UpdateRendererWithOutput');

const PRESETS = require('../presets');

const MASTERNODE_DASH_AMOUNT = 1000;

class RegisterCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {startCore} startCore
   * @param {createNewAddress} createNewAddress
   * @param {generateToAddress} generateToAddress
   * @param {generateBlocks} generateBlocks
   * @param {waitForCoreSync} waitForCoreSync
   * @param {importPrivateKey} importPrivateKey
   * @param {getAddressBalance} getAddressBalance
   * @param {generateBlsKeys} generateBlsKeys
   * @param {sendToAddress} sendToAddress
   * @param {waitForConfirmations} waitForConfirmations
   * @param {registerMasternode} registerMasternode
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset, port, 'private-key': privateKey, 'external-ip': externalIp,
    },
    flags,
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
        title: `Register masternode using ${preset} preset`,
        task: () => (
          new Listr([

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
              task: async (ctx) => importPrivateKey(ctx.coreService, ctx.fundSourcePrivateKey),
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
                task.output = `Public key: ${ctx.bls.publicKey}\nPrivate key: ${ctx.bls.privateKey}`;
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
                ctx.tx = await sendToAddress(
                  ctx.coreService,
                  ctx.fundSourcePrivateKey,
                  ctx.fundSourceAddress,
                  ctx.collateral.address,
                  1000,
                );

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
                      observer.next(`${confirmations} ${confirmations > 1 ? 'confirmations' : 'confirmation'}`);
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
              // eslint-disable-next-line consistent-return
              task: async (ctx) => {
                const { result: height } = await ctx.coreService.getRpcClient().getBlockCount();

                if (height < 1000) {
                  return new Observable(async (observer) => {
                    await generateBlocks(
                      ctx.coreService,
                      1000 - height,
                      (blocks) => {
                        const remaining = 1000 - height - blocks;
                        observer.next(`${remaining} ${remaining > 1 ? 'blocks' : 'block'} remaining`);
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
                const tx = await registerMasternode(
                  ctx.coreService,
                  ctx.tx,
                  ctx.externalIp,
                  ctx.port,
                  ctx.owner.address,
                  ctx.bls.publicKey,
                  ctx.fundSourceAddress,
                );

                // eslint-disable-next-line no-param-reassign
                task.output = `Hash: ${tx}\nDon't forget to add bls private key to your configuration`;
              },
            },
          ])
        ),
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    let context;

    try {
      context = await tasks.run({
        fundSourceAddress,
        fundSourcePrivateKey: privateKey,
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
