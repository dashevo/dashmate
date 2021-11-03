const { table } = require('table');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
const getFormat = require('../../util/getFormat');
const { OUTPUT_FORMATS } = require('../../constants');

const ContainerIsNotPresentError = require('../../docker/errors/ContainerIsNotPresentError');

const ConfigBaseCommand = require('../../oclif/command/ConfigBaseCommand');

class ServicesStatusCommand extends ConfigBaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @param {Config} config
   * @return {Promise<void>}
   */
  async runWithDependencies(
    args,
    flags,
    dockerCompose,
    config,
  ) {
    const serviceHumanNames = {
      core: 'Core',
    };

    if (config.get('core.masternode.enable')) {
      Object.assign(serviceHumanNames, {
        sentinel: 'Sentinel',
      });
    }

    if (config.get('network') !== 'mainnet') {
      Object.assign(serviceHumanNames, {
        drive_mongodb: 'Drive MongoDB',
        drive_abci: 'Drive ABCI',
        drive_tenderdash: 'Drive Tenderdash',
        dapi_api: 'DAPI API',
        dapi_tx_filter_stream: 'DAPI Transactions Filter Stream',
        dapi_envoy: 'DAPI Envoy',
      });
    }

    const outputRows = [];

    for (const [serviceName, serviceDescription] of Object.entries(serviceHumanNames)) {
      let containerId;
      let status;
      let image;

      try {
        ({
          Id: containerId,
          State: {
            Status: status,
          },
          Config: {
            Image: image,
          },
        } = await dockerCompose.inspectService(config.toEnvs(), serviceName));
      } catch (e) {
        if (e instanceof ContainerIsNotPresentError) {
          status = 'not started';
        }
      }

      let statusText;
      if (status) {
        statusText = (status === 'running' ? chalk.green : chalk.red)(status);
      }

      outputRows.push([
        serviceDescription,
        containerId ? containerId.slice(0, 12) : undefined,
        image,
        statusText,
      ]);
    }

    let output;

    if (getFormat(flags) === OUTPUT_FORMATS.JSON) {
      outputRows.forEach((outputRow, i) => {
        outputRow.forEach((value, j) => {
          // eslint-disable-next-line no-param-reassign
          outputRow[j] = stripAnsi(value);
        });
        outputRows[i] = outputRow;
      });
      output = JSON.stringify(outputRows);
    } else {
      outputRows.unshift(['Service', 'Container ID', 'Image', 'Status']);

      const tableConfig = {
        drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size,
      };

      output = table(outputRows, tableConfig);
    }

    // eslint-disable-next-line no-console
    console.log(output);
  }
}

ServicesStatusCommand.description = 'Show service status details';

ServicesStatusCommand.flags = {
  ...ConfigBaseCommand.flags,
};

module.exports = ServicesStatusCommand;
