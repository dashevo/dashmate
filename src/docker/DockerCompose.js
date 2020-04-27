const path = require('path');

const dockerCompose = require('docker-compose');

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

    try {
      ({ out: containerName } = await dockerCompose.run(
        serviceName,
        command,
        {
          ...this.getOptions(preset),
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
    await this.throwErrorIfNotReady();

    let psOutput;

    try {
      ({ out: psOutput } = await dockerCompose.ps({
        ...this.getOptions(preset),
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
   * Is Docker Compose ready?
   *
   * @return {Promise<boolean>}
   */
  async isReady() {
    try {
      await dockerCompose.ps(this.getOptions('local'));
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * @private
   * @return {Promise<void>}
   */
  async throwErrorIfNotReady() {
    if (!(await this.isReady())) {
      throw new Error('Docker Compose doesn\'t respond');
    }
  }

  /**
   * @private
   * @param {string} preset
   * @return {{cwd: string, config: string, composeOptions: [string, string]}}
   */
  getOptions(preset) {
    return {
      cwd: path.join(__dirname, '../../'),
      config: 'docker-compose.yml',
      composeOptions: [
        '--env-file', `.env.${preset}`,
      ],
    };
  }
}

module.exports = DockerCompose;
