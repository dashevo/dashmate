const Listr = require('listr');

const dpnsDocumentSchema = require('@dashevo/dpns-contract/src/schema/dpns-documents.json');

const wait = require('../util/wait');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @param {startNodeTask} startNodeTask
 * @param {createClientWithFundedWallet} createClientWithFundedWallet
 * @return {initTask}
 */
function initTaskFactory(
  dockerCompose,
  startNodeTask,
  createClientWithFundedWallet,
) {
  /**
   * @typedef {initTask}
   * @param {string} preset
   * @param {string} network
   * @param {string} driveImageBuildPath
   * @param {string} dapiImageBuildPath
   */
  function initTask(
    preset,
    network,
    driveImageBuildPath,
    dapiImageBuildPath,
  ) {
    return new Listr([
      {
        title: `Start masternode with ${preset} preset`,
        task: async (ctx) => startNodeTask(
          preset,
          {
            externalIp: ctx.externalIp,
            coreP2pPort: ctx.coreP2pPort,
            privateKey: ctx.operator.privateKey,
            driveImageBuildPath,
            dapiImageBuildPath,
          },
        ),
      },
      {
        title: 'Initialize SDK',
        task: async (ctx) => {
          // wait 5 seconds to ensure everything were initialized
          await wait(5000);

          ctx.client = await createClientWithFundedWallet(
            preset,
            network,
            ctx.fundingPrivateKeyString,
          );
        },
      },
      {
        title: 'Register DPNS top level identity',
        task: async (ctx, task) => {
          ctx.identity = await ctx.client.platform.identities.register(2);

          // eslint-disable-next-line no-param-reassign
          task.output = `Top level identity: ${ctx.identity.getId()}`;
        },
      },
      {
        title: 'Register DPNS contract',
        task: async (ctx, task) => {
          const dataContract = await ctx.client.platform.contracts.create(
            dpnsDocumentSchema, ctx.identity,
          );

          await ctx.client.platform.contracts.broadcast(
            dataContract,
            ctx.identity,
          );

          // eslint-disable-next-line no-param-reassign
          task.output = `Contract id: ${dataContract.getId()}`;
        },
      },
      {
        title: 'Close SDK',
        task: async (ctx) => ctx.client.disconnect(),
      },
    ]);
  }

  return initTask;
}

module.exports = initTaskFactory;
