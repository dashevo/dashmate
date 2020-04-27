const path = require('path');

const dockerCompose = require('docker-compose');

const hasbin = require('hasbin');

const DockerComposeError = require('./errors/DockerComposeError');
const ServiceAlreadyRunningError = require('./errors/ServiceAlreadyRunningError');

class DockerCompose {
  constructor(docker) {
    this.docker = docker;
  }

  /**
   * Run service
   *
   * @param {string} preset
   * @param {string} serviceName
   * @param {array} [command]
   * @param {Object} [options]
   * @return {Promise<Container>}
   */
  async runService(preset, serviceName, command = [], options = {}) {
    if (await this.isServiceRunning(preset, serviceName)) {
      throw new ServiceAlreadyRunningError(preset, serviceName);
    }

    let containerName;
    const env = this.getPlaceholderEnvOptions();

    try {
      ({ out: containerName } = await dockerCompose.run(
        serviceName,
        command,
        {
          ...this.getOptions(preset, env),
          commandOptions: options,
        },
      ));
    } catch (e) {
      throw new DockerComposeError(e);
    }

    return this.docker.getContainer(containerName.trim());
  }

  /**
   * Is service running?
   *
   * @param {string} preset
   * @param {string} serviceName
   * @return {Promise<boolean>}
   */
  async isServiceRunning(preset, serviceName) {
    await this.throwErrorIfNotInstalled();

    let psOutput;

    const env = this.getPlaceholderEnvOptions();

    try {
      ({ out: psOutput } = await dockerCompose.ps({
        ...this.getOptions(preset, env),
        commandOptions: ['-q', serviceName],
      }));
    } catch (e) {
      throw new DockerComposeError(e);
    }

    const coreContainerIds = psOutput.trim().split('\n').filter((containerId) => containerId !== '');

    for (const containerId of coreContainerIds) {
      const container = this.docker.getContainer(containerId);

      const { State: { Status: status } } = await container.inspect();

      if (status === 'running') {
        return true;
      }
    }

    return false;
  }

  /**
   * @private
   * @return {Promise<void>}
   */
  async throwErrorIfNotInstalled() {
    if (!hasbin.sync('docker')) {
      throw new Error('Docker is not installed');
    }

    if (!hasbin.sync('docker-compose')) {
      throw new Error('Docker Compose is not installed');
    }
  }

  /**
   * @private
   * @param {string} preset
   * @param {Object} [envOptions]
   * @return {{cwd: string, config: string, composeOptions: [string, string]}}
   */
  getOptions(preset, envOptions = undefined) {
    let env;

    if (envOptions !== undefined) {
      env = Object.assign(process.env, envOptions);
    }

    return {
      cwd: path.join(__dirname, '../../'),
      config: 'docker-compose.yml',
      composeOptions: [
        '--env-file', `.env.${preset}`,
      ],
      env,
    };
  }

  /**
   * @private
   * @return {Object}
   */
  getPlaceholderEnvOptions() {
    return {
      CORE_EXTERNAL_IP: '127.0.0.1',
      CORE_MASTERNODE_BLS_PRIV_KEY: 'bls',
      CORE_P2P_PORT: 20001,
    };
  }
}

module.exports = DockerCompose;
