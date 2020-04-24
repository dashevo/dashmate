const Listr = require('listr');
const { Observable } = require('rxjs');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');

const PRESETS = require('../../presets');

class GenerateToAddressCommand extends BaseCommand {
  async run() {
    const { flags, args } = this.parse(GenerateToAddressCommand);
    const { address } = flags;
    const { preset, amount } = args;

    const tasks = new Listr([
      {
        title: `Generate ${amount} dash to ${address || 'new'} address using ${preset} preset`,
        task: () => (
          new Listr([
            {
              title: 'Start Core',
              task: async (ctx) => {
                /**
                 * @type {startCore}
                 */
                const startCore = this.container.resolve('startCore');

                ctx.coreService = await startCore(preset, { wallet: true });
              },
            },
            {
              title: 'Sync Core with network',
              enabled: () => preset !== PRESETS.LOCAL,
              task: async (ctx) => {
                /**
                 *
                 * @type {waitForCoreSync}
                 */
                const waitForCoreSync = this.container.resolve('waitForCoreSync');

                await waitForCoreSync(ctx.coreService);
              },
            },
            {
              title: 'Create new address',
              enabled: (ctx) => ctx.address === null,
              task: async (ctx) => {
                /**
                 * @type {createNewAddress}
                 */
                const createNewAddress = this.container.resolve('createNewAddress');

                ({
                  address: ctx.address,
                  privateKey: ctx.privateKey,
                } = await createNewAddress(ctx.coreService));
              },
            },
            {
              title: `Generate ${amount} dash to address`,
              task: (ctx) => {
                /**
                 * @type {generateToAddress}
                 */
                const generateToAddress = this.container.resolve('generateToAddress');

                return new Observable(async (observer) => {
                  await generateToAddress(
                    ctx.coreService,
                    amount,
                    ctx.address,
                    (balance) => {
                      ctx.balance = balance;
                      observer.next(`${balance} dash generated`);
                    },
                  );

                  observer.complete();
                });
              },
            },
            {
              title: 'Wait for 100 confirmations',
              enabled: () => preset === PRESETS.LOCAL,
              task: async (ctx) => {
                // generate 100 blocks to unlock dash
                await ctx.coreService.getRpcClient().generate(100);
              },
            },
          ])
        ),
      },
    ],
    { collapse: false });

    let context;
    try {
      context = await tasks.run({
        address,
      });

      this.log('\n');
      this.log(`Generated ${context.balance} dash`);
      this.log(`Address: ${context.address}`);

      if (context.privateKey) {
        this.log(`Private key: ${context.privateKey}`);
      }

      if (preset !== PRESETS.LOCAL) {
        this.log('You need to wait at least 100 blocks');
      }
    } catch (e) {
      context = e.context;
    } finally {
      if (context && context.coreService) {
        await context.coreService.stop();
      }
    }
  }
}

GenerateToAddressCommand.description = `Generate new address
...
Generate new address with defined amount of dash
`;

GenerateToAddressCommand.flags = {
  address: flagTypes.string({ char: 'a', description: 'amount of dash to be generated to new address', default: null }),
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
  description: 'amount of dash to be generated to new address',
  parse: (input) => parseInt(input, 10),
}];

module.exports = GenerateToAddressCommand;
