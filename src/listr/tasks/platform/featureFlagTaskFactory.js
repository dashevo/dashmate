const { Listr } = require('listr2');

const Dash = require('dash');
const dpp = require('@dashevo/dpp');
const DataTrigger = require('@dashevo/dpp/lib/dataTrigger/DataTrigger');
const Identifier = require('@dashevo/dpp/lib/Identifier');
const featureFlagsDocumentSchema = require('@dashevo/feature-flags-contract/schema/feature-flags-documents.json');

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
              HDPrivateKey: ctx.featureFlagIdentityPrivateKey,
            },
          });
        },
      },
      {
        title: 'Register feature flag contract',
        task: async (ctx) => {
          const featureFlagsContractId = config.get('platform.featureFlags.contract.id');
          const featureFlagsContract = await ctx.client.platform.contracts.get(featureFlagsContractId);
          ctx.client.apps.apps.featureFlags = {
            contractId: Identifier.from(featureFlagsContractId),
            featureFlagsContract,
          };
          const debug = ctx.client.getApps();
          console.log(debug);
        },
      },
      {
        title: 'Enable feature flag',
        task: async (ctx) => {
          // const trigger = await ctx.client.platform.contracts.create(
          //   featureFlagsDocumentSchema, ctx.featureFlagsIdentity,
          // );

          // const updateFeatureFlagsContract = async () => {
          
          // const { platform } = ctx.client;
          // const identity = await platform.identities.get(config.get('platform.featureFlags.ownerId'));
          // const documentId = config.get('platform.featureFlags.contract.id');

          // Retrieve the existing document
          // Doesn't work, this is a contract not a document???
          // const featureFlagStateTransition = await ctx.client.platform.documents.get(documentId);




          const submitFeatureFlagDocument = async () => {
            const featureFlagsFlag = `featureFlags.${ctx.featureFlagName}`;
            const identity = await ctx.client.platform.identities.get(config.get('platform.featureFlags.ownerId'));
            const integerHeight = Number(ctx.height);

            const docProperties = {
              enableAtHeight: integerHeight,
            };

            // What does `getApps().set()` do, where is this documented?
            // Shouldn't the app already exist on the network?
            // Is an app the same as a contract?
            // ctx.client.getApps().set('featureFlags', {
            //   contractId: ctx.featureFlagsDataContract.getId(),
            //   contract: ctx.featureFlagsDataContract,
            // });

            const debug = ctx.client.getApps();
            console.log(debug);

            const featureFlagDocument = await ctx.client.platform.documents.create(
              featureFlagsFlag,
              identity,
              docProperties,
            );

            const documentBatch = {
              create: [],
              replace: [featureFlagDocument],
              delete: [],
            };

            // Sign and submit the document(s)
            return ctx.client.platform.documents.broadcast(documentBatch, identity);
          };

          // Update document
          // ctx.featureFlagsDataContract.set(featureFlagsFlag, {
          //   enableAtHeight: ctx.height,
          // });

          // Sign and submit the document replace transition
          // return ctx.client.platform.documents.broadcast({ replace: [featureFlagStateTransition] }, ctx.featureFlagsIdentity);

          submitFeatureFlagDocument()
            .then((d) => console.log('Document updated:\n', d))
            .catch((e) => console.error('Something went wrong:\n', e))
            .finally(() => ctx.client.disconnect());


          // Failed attempt using DPP directly
          // const stateTransition = await dpp.stateTransition.createFromBuffer(trigger);

          // const featureFlagStateTransition = new DataTrigger(
          //   config.get('platform.featureFlags.contract.id'),
          //   ctx.featureFlagName,
          //   1,
          //   [stateTransition],
          //   ctx.featureFlagsIdentity,
          // );

          // featureFlagStateTransition.execute();


          // Initial attempt
          // const featureFlags = `featureFlags.${ctx.name}`;
          // const enableAtHeight = ctx.height;
          // const featureFlagStateTransition = await ctx.client.platform.documents.create(
          //   featureFlags,
          //   ctx.featureFlagsIdentity,
          //   {
          //     enabled: true,
          //     enableAtHeight,
          //   },
          // );

          // await ctx.client.platform.documents.broadcast({
          //   replace: [featureFlagStateTransition],
          // }, ctx.featureFlagsIdentity);
        },
        options: { persistentOutput: true },
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
