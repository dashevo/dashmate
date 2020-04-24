const Listr = require('listr');
const { Observable } = require('rxjs');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');

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
                      observer.next(`${balance} dash generated`);
                    },
                  );

                  observer.complete();
                });
              },
            },
            {
              title: 'Wait for 100 confirmations',
              task: async (ctx, task) => {
                if (preset === 'local') {
                  // generate 100 blocks to unlock dash
                  await ctx.coreService.getRpcClient().generate(100);
                } else {
                  task.skip('You need to wait at least 100 block');
                }
              },
            },
          ])
        ),
      },
    ]);

    let context;
    try {
      context = await tasks.run({
        address,
      });
    } catch (e) {
      context = e.context;

      throw e;
    } finally {
      if (context.coreService) {
        await context.coreService.stop();
      }
    }

    // this.info(`Generated ${addressBalance} dash`);
    // this.info(`Address: ${address}\nPrivate key: ${privateKey}`);
    // this.info(`Balance is ${addressBalance} dash`);
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
  description: '-preset to use',
  options: [
    'evonet',
    'local',
  ],
}, {
  name: 'amount',
  required: true,
  description: '-amount of dash to be generated to new address',
  parse: (input) => parseInt(input, 10),
}];

module.exports = GenerateToAddressCommand;
