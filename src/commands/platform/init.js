const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../../oclif/command/BaseCommand');
const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

class InitCommand extends BaseCommand {
  /**
   *
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {initTask} initTask
   * @param {ConfigCollection} configCollection
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      seed,
      'funding-private-key': fundingPrivateKeyString,
    },
    {
      config: configName,
      'drive-image-build-path': driveImageBuildPath,
      'dapi-image-build-path': dapiImageBuildPath,
    },
    dockerCompose,
    initTask,
    configCollection,
  ) {
    const config = configName === null
      ? configCollection.getDefaultConfig()
      : configCollection.getConfig(configName);

    const tasks = new Listr([
      {
        title: 'Initialize Platform',
        task: () => initTask(config),
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
        fundingPrivateKeyString,
        seed,
        driveImageBuildPath,
        dapiImageBuildPath,
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
  name: 'funding-private-key',
  required: true,
  description: 'private key with dash for funding account',
},
{
  name: 'seed',
  description: 'DAPI seed to connect',
}];

InitCommand.flags = {
  config: flagTypes.string({
    description: 'configuration name to use',
    default: null,
  }),
  'drive-image-build-path': flagTypes.string({
    description: 'drive\'s docker image build path',
    default: null,
  }),
  'dapi-image-build-path': flagTypes.string({
    description: 'dapi\'s docker image build path',
    default: null,
  }),
};

module.exports = InitCommand;
