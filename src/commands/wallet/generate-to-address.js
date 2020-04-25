const Listr = require('listr');
const { Observable } = require('rxjs');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../oclif/renderer/UpdateRendererWithOutput');

const PRESETS = require('../../presets');

class GenerateToAddressCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {startCore} startCore
   * @param {createNewAddress} createNewAddress
   * @param {generateToAddress} generateToAddress
   * @param {generateBlocks} generateBlocks
   * @param {waitForCoreSync} waitForCoreSync
   * @return {Promise<void>}
   */
  async runWithDependencies(
    { preset, amount },
    { address },
    startCore,
    createNewAddress,
    generateToAddress,
    generateBlocks,
    waitForCoreSync,
  ) {
    const tasks = new Listr([
      {
        title: `Generate ${amount} dash to address using ${preset} preset`,
        task: () => (
          new Listr([
            {
              title: 'Start Core',
              task: async (ctx) => {
                ctx.coreService = await startCore(preset, { wallet: true });
              },
            },
            {
              title: 'Sync Core with network',
              enabled: () => preset !== PRESETS.LOCAL,
              task: async (ctx) => waitForCoreSync(ctx.coreService),
            },
            {
              title: 'Create a new address',
              skip: (ctx) => {
                if (ctx.address !== null) {
                  return `Use specified address ${ctx.address}`;
                }

                return false;
              },
              task: async (ctx, task) => {
                ({
                  address: ctx.address,
                  privateKey: ctx.privateKey,
                } = await createNewAddress(ctx.coreService));

                // eslint-disable-next-line no-param-reassign
                task.output = `Address: ${ctx.address}\nPrivate key: ${ctx.privateKey}`;
              },
            },
            {
              title: `Generate ${amount} dash to address`,
              task: (ctx, task) => (
                new Observable(async (observer) => {
                  await generateToAddress(
                    ctx.coreService,
                    amount,
                    ctx.address,
                    (balance) => {
                      ctx.balance = balance;
                      observer.next(`${balance} dash generated`);
                    },
                  );

                  // eslint-disable-next-line no-param-reassign
                  task.output = `Generated ${ctx.balance} dash`;

                  observer.complete();
                })
              ),
            },
            {
              title: 'Mine 1 block to confirm',
              task: async (ctx) => (
                new Observable(async (observer) => {
                  await generateBlocks(
                    ctx.coreService,
                    1,
                    (blocks) => {
                      observer.next(`${blocks} ${blocks > 1 ? 'blocks' : 'block'} mined`);
                    },
                  );

                  observer.complete();
                })
              ),
            },
          ])
        ),
      },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    let context;
    try {
      context = await tasks.run({
        address,
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

GenerateToAddressCommand.description = `Generate dash to address
...
Generate specified amount of dash to a new address or specified one
`;

GenerateToAddressCommand.flags = {
  address: flagTypes.string({ char: 'a', description: 'recipient address instead of a new one', default: null }),
};

GenerateToAddressCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: [
    PRESETS.EVONET,
    PRESETS.LOCAL,
  ],
}, {
  name: 'amount',
  required: true,
  description: 'amount of dash to be generated to address',
  parse: (input) => parseInt(input, 10),
}];

module.exports = GenerateToAddressCommand;
