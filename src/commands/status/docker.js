const {table} = require('table');
const chalk = require('chalk');

const BaseCommand = require('../../oclif/command/BaseCommand');

const MuteOneLineError = require('../../oclif/errors/MuteOneLineError');

const PRESETS = require('../../presets');

class DockerStatusCommand extends BaseCommand {
  /**
   * @param {Object} args
   * @param {Object} flags
   * @param {DockerCompose} dockerCompose
   * @return {Promise<void>}
   */
  async runWithDependencies(
    {
      preset,
    },
    flags,
    dockerCompose,
  ) {
    const data = [];
    let output;

    const tableConfig = {
      //singleLine: true,
      drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
      }
    };

    const serviceNames = {
      core: 'Dash Core daemon',
      dapi_api: 'DAPI',
      dapi_envoy: 'Envoy proxy',
      drive_mongodb: 'MongoDB',
      drive_mongodb_replica_init: 'Initiate MongoDB replica',
      dapi_tx_filter_stream: 'DAPI transaction filter stream',
      drive_abci: 'Tendermint ABCI',
      dapi_nginx: 'DAPI nginx',
      dapi_insight: 'DAPI Insight',
      drive_tendermint: 'Tendermint',
      sentinel: 'Dash Sentinel'
    }

    data.push(...(await dockerCompose.inspectService(preset))
      .filter(e => e[0] != 'drive_mongodb_replica_init'));
    data.forEach(e => e[0] = serviceNames[e[0]])
    data.forEach(e => e[2] === 'running' ? e[2] = chalk.green(e[2]) : e[2] = chalk.red(e[2]));
    data.unshift(['Service', 'ID', 'Status']);

    try {
      output = table(data, tableConfig);
      console.log(output);
    } catch (e) {
      throw new MuteOneLineError(e);
    }
  }
}

DockerStatusCommand.description = 'Show Docker status details';

DockerStatusCommand.args = [{
  name: 'preset',
  required: true,
  description: 'preset to use',
  options: Object.values(PRESETS),
}];

module.exports = DockerStatusCommand;
