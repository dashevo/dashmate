const Listr = require('listr');

const { flags: flagTypes } = require('@oclif/command');
const dpnsDocumentSchema = require('@dashevo/dpns-contract/src/schema/dpns-documents.json');

const BaseCommand = require('../../oclif/command/BaseCommand');
const UpdateRendererWithOutput = require('../../oclif/renderer/UpdateRendererWithOutput');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const PRESETS = require('../../presets');
const wait = require('../../util/wait');

class InitCommand extends BaseCommand {
  /**
   *
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {startNode} startNode
   * @param {createClientWithFundedWallet} createClientWithFundedWallet
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
      'funding-private-key': fundingPrivateKeyString,
      'operator-private-key': operatorPrivateKey,
      'external-ip': externalIp,
      'core-p2p-port': coreP2pPort,
    },
    {
      'drive-image-build-path': driveImageBuildPath,
      'dapi-image-build-path': dapiImageBuildPath,
    },
    dockerCompose,
    startNode,
    createClientWithFundedWallet,
  ) {
    const network = 'testnet';

    const tasks = new Listr([{
      title: `Initialize Platform for ${preset} preset`,
      task: () => (
        new Listr([
          {
            title: `Start masternode with ${preset} preset`,
            task: async () => startNode(
              preset,
              {
                externalIp,
                coreP2pPort,
                operatorPrivateKey,
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
            title: 'Register DPNS identity',
            task: async (ctx, task) => {
              ctx.identity = await ctx.client.platform.identities.register(10000);

              // eslint-disable-next-line no-param-reassign
              task.output = `DPNS identity: ${ctx.identity.getId()}`;
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
              task.output = `DPNS contract ID: ${dataContract.getId()}`;
            },
          },
          {
            title: 'Disconnect SDK',
            task: async (ctx) => ctx.client.disconnect(),
          },
          {
            title: `Stop masternode with ${preset} preset`,
            task: async () => dockerCompose.stop(preset),
          },
        ])
      ),
    },
    ],
    { collapse: false, renderer: UpdateRendererWithOutput });

    try {
      await tasks.run({
        fundingPrivateKeyString,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

InitCommand.description = `Initialize platform
...
Register DPNS Contract and "dash" top-level domain
`;

InitCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}, {
  name: 'funding-private-key',
  required: true,
  description: 'private key with dash for funding account',
}, {
  name: 'operator-private-key',
  required: true,
  description: 'operator private key',
}, {
  name: 'external-ip',
  required: true,
  description: 'masternode external IP',
}, {
  name: 'core-p2p-port',
  required: true,
  description: 'Core P2P port',
}];

InitCommand.flags = {
  'drive-image-build-path': flagTypes.string({ description: 'drive\'s docker image build path', default: null }),
  'dapi-image-build-path': flagTypes.string({ description: 'dapi\'s docker image build path', default: null }),
};

module.exports = InitCommand;
