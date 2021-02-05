const { Listr } = require('listr2');

const { flags: flagTypes } = require('@oclif/command');

const BaseCommand = require('../oclif/command/BaseCommand');

const MuteOneLineError = require('../oclif/errors/MuteOneLineError');

const {
  PRESET_LOCAL,
  PRESETS,
  NODE_TYPES,
  NODE_TYPE_MASTERNODE,
} = require('../constants');

class SetupCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {generateBlsKeys} generateBlsKeys
   * @param {setupLocalPresetTask} setupLocalPresetTask
   * @param {setupRegularPresetTask} setupRegularPresetTask
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
      'node-type': nodeType,
    },
    {
      'external-ip': externalIp,
      'operator-bls-private-key': operatorBlsPrivateKey,
      update: isUpdate,
      'drive-image-build-path': driveImageBuildPath,
      'dapi-image-build-path': dapiImageBuildPath,
      verbose: isVerbose,
    },
    generateBlsKeys,
    setupLocalPresetTask,
    setupRegularPresetTask,
  ) {
    if (preset === PRESET_LOCAL) {
      if (nodeType === undefined) {
        // eslint-disable-next-line no-param-reassign
        nodeType = 'masternode';
      }

      if (nodeType !== NODE_TYPE_MASTERNODE) {
        throw new Error('Local development preset uses only masternode type of node');
      }
    }

    const tasks = new Listr([
      {
        title: 'Set configuration preset',
        task: async (ctx, task) => {
          if (ctx.preset === undefined) {
            ctx.preset = await task.prompt([
              {
                type: 'select',
                message: 'Select configuration preset',
                choices: PRESETS,
                initial: 'testnet',
              },
            ]);
          }
        },
      },
      {
        task: (ctx) => {
          if (ctx.preset === PRESET_LOCAL) {
            return setupLocalPresetTask({ updateImages: isUpdate });
          }

          return setupRegularPresetTask();
        },
      },
    ],
    {
      renderer: isVerbose ? 'verbose' : 'default',
      rendererOptions: {
        clearOutput: false,
        collapse: false,
        showSubtasks: true,
      },
    });

    try {
      await tasks.run({
        driveImageBuildPath,
        dapiImageBuildPath,
        preset,
        nodeType,
        externalIp,
        operatorBlsPrivateKey,
      });
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

SetupCommand.description = `Set up node config

Set up node config
`;

SetupCommand.args = [{
  name: 'preset',
  required: false,
  description: 'Node configuration preset',
  options: PRESETS,
},
{
  name: 'node-type',
  required: false,
  description: 'Node type',
  options: NODE_TYPES,
}];

SetupCommand.flags = {
  'external-ip': flagTypes.string({ char: 'i', description: 'external ip' }),
  'operator-bls-private-key': flagTypes.string({ char: 'k', description: 'operator bls private key' }),
  update: flagTypes.boolean({ char: 'u', description: 'download updated services before start', default: false }),
  'drive-image-build-path': flagTypes.string({ description: 'drive\'s docker image build path', default: null }),
  'dapi-image-build-path': flagTypes.string({ description: 'dapi\'s docker image build path', default: null }),
  verbose: flagTypes.boolean({ char: 'v', description: 'use verbose mode for output', default: false }),
};

module.exports = SetupCommand;
