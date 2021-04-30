const { Listr } = require('listr2');

const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class InitCommand extends ConfigBaseCommand {
  /**
   *
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {initTask} initTask
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      name,
      height,
      'dapi-address': dapiAddress,
      'feature-flags-identity': featureFlagsIdentity,
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
        dapiAddress,
        name,
        height,
        featureFlagsIdentity,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

InitCommand.description = `Feature flags
...
Register feature flags
`;

InitCommand.args = [{
  name: 'name',
  required: true,
  description: 'name of the feature flag to process',
  options: ['updateConsensusParams', 'fixCumulativeFeesBug', 'verifyLLMQSignaturesWithCore'],
},
{
  name: 'height',
  required: false,
  description: 'height of feature flag',
},
{
  name: 'dapiAddress',
  required: false,
  description: 'DAPI address to send init transitions to',
},
{
  name: 'feature-flags-identity',
  required: false,
  description: 'identity of the feature flags contract owner',
}];

InitCommand.flags = {
  ...ConfigBaseCommand.flags,
};

module.exports = InitCommand;
