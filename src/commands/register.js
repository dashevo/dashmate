const { flags: flagTypes } = require('@oclif/command');

const { Listr } = require('listr2');

const { PrivateKey } = require('@dashevo/dashcore-lib');

const BaseCommand = require('../oclif/command/BaseCommand');
const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

const masternodeDashAmount = require('../core/masternodeDashAmount');

class RegisterCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {registerMasternodeTask} registerMasternodeTask
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      'funding-private-key': fundingPrivateKeyString,
    },
    {
      config: configName,
      saveOperatorPrivateKey,
    },
    registerMasternodeTask,
    configCollection,
  ) {
    const config = configName === null
      ? configCollection.getDefaultConfig()
      : configCollection.getConfig(configName);

    const network = config.get('network');

    const fundingPrivateKey = new PrivateKey(
      fundingPrivateKeyString,
      network,
    );

    const fundingAddress = fundingPrivateKey.toAddress(network).toString();

    const tasks = new Listr([
      {
        title: 'Register masternode',
        task: () => registerMasternodeTask(config),
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
        fundingAddress,
        fundingPrivateKeyString,
        saveOperatorPrivateKey,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

RegisterCommand.description = `Register masternode

Register masternode
`;

RegisterCommand.args = [{
  name: 'funding-private-key',
  required: true,
  description: `private key with more than ${masternodeDashAmount} dash for funding collateral`,
}];

RegisterCommand.flags = {
  config: flagTypes.string({
    description: 'configuration name to use',
    default: null,
  }),
};

module.exports = RegisterCommand;
