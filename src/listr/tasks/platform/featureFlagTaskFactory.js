const { Listr } = require('listr2');

const Dash = require('dash');

/**
 *
 * @return {featureFlagTask}
 */
function featureFlagTaskFactory() {
  /**
   * @typedef {featureFlagTask}
   * @param {Config} config
   * @return {Listr}
   */
  function featureFlagTask(
    config,
  ) {
    return new Listr([
      {
        title: 'Initialize SDK',
        task: async (ctx) => {
          const clientOpts = {
            network: config.get('network'),
          };

          if (ctx.dapiAddress) {
            clientOpts.dapiAddresses = [ctx.dapiAddress];
          }

          ctx.client = new Dash.Client({
            ...clientOpts,
            wallet: {
              mnemonic: null,
            },
          });
        },
      },
      {
        title: 'Enable feature flag',
        task: async (ctx) => {
          const featureFlag = `featureFlags.${ctx.name}`;
          const enableAtHeight = ctx.height;

          const document = await ctx.client.platform.documents.create(
            featureFlag,
            ctx.featureFlagsIdentity,
            {
              enabled: true,
              enableAtHeight,
            },
          );

          await ctx.client.platform.documents.broadcast({
            create: [document],
          }, ctx.featureFlagsIdentity);
        },
      },
      {
        title: 'Disconnect SDK',
        task: async (ctx) => ctx.client.disconnect(),
      },
    ]);
  }

  return featureFlagTask;
}

module.exports = featureFlagTaskFactory;
