const { Listr } = require('listr2');

const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class FeatureFlagCommand extends ConfigBaseCommand {
  /**
   *
   * @param {Object} args
   * @param {Object} flags
   * @param {featureFlagTask} featureFlagTask
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      'feature-flag-name': featureFlagName,
      height,
      'feature-flag-identity-private-key': featureFlagIdentityPrivateKey,
      'dapi-address': dapiAddress,
    },
    {
      verbose: isVerbose,
    },
    featureFlagTask,
    config,
  ) {
    const tasks = new Listr([
      {
        title: 'Initialize Feature Flags',
        task: () => featureFlagTask(config),
      },
    ],
    {
      renderer: isVerbose ? 'verbose' : 'default',
      rendererOptions: {
        showTimer: isVerbose,
        clearOutput: false,
        collapse: false,
        showSubtasks: true,
      },
    });

    try {
      await tasks.run({
        featureFlagName,
        height,
        featureFlagIdentityPrivateKey,
        dapiAddress,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

FeatureFlagCommand.description = `Feature flags
...
Register feature flags
`;

FeatureFlagCommand.args = [{
  name: 'feature-flag-name',
  required: true,
  description: 'name of the feature flag to process',
  options: ['updateConsensusParams', 'fixCumulativeFeesBug', 'verifyLLMQSignaturesWithCore'],
},
{
  name: 'height',
  required: true,
  description: 'height of feature flag',
},
{
  name: 'feature-flag-identity-private-key',
  required: true,
  description: 'feature flag contract owner ID private key',
},
{
  name: 'dapi-address',
  required: false,
  description: 'DAPI address to send init transitions to',
}];

FeatureFlagCommand.flags = {
  ...ConfigBaseCommand.flags,
};

module.exports = FeatureFlagCommand;
