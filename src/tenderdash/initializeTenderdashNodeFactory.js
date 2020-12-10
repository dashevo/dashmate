const { WritableStream } = require('memory-streams');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @param {Docker} docker
 * @return {initializeTenderdashNode}
 */
function initializeTenderdashNodeFactory(dockerCompose, docker) {
  /**
   * @typedef {initializeTenderdashNode}
   * @param {Config} config
   * @return {Promise<Object>}
   */
  async function initializeTenderdashNode(config) {
    if (await dockerCompose.isServiceRunning(config.toEnvs(), 'drive_tenderdash')) {
      throw new Error('Can\'t initialize Tenderdash. Already running.');
    }

    const { COMPOSE_PROJECT_NAME: composeProjectName } = config.toEnvs();
    const volumeName = 'drive_tenderdash_data';
    const volumeNameFullName = `${composeProjectName}_${volumeName}`;

    const volume = docker.getVolume(volumeNameFullName);

    const isVolumeDefined = await volume.inspect()
      .then(() => true)
      .catch(() => false);

    if (!isVolumeDefined) {
      // Create volume with tenderdash data
      await docker.createVolume({
        Name: volumeNameFullName,
        Labels: {
          'com.docker.compose.project': composeProjectName,
          'com.docker.compose.version': '1.27.4',
          'com.docker.compose.volume': volumeName,
        },
      });

      // Set tmuser ownership for the volume
      await docker.pull('alpine:latest');

      const writableStream = new WritableStream();

      const command = [
        'addgroup tmuser',
        'adduser -S -G tmuser tmuser',
        'chown -R tmuser:tmuser /tenderdash',
      ].join('&&');

      const [result] = await docker.run(
        'alpine:latest',
        ['sh', '-c', command],
        writableStream,
        {
          HostConfig: {
            AutoRemove: true,
            Binds: [`${volumeNameFullName}:/tenderdash/data`],
          },
        },
        {},
      );

      if (result.StatusCode !== 0) {
        throw new Error(result.Error || writableStream.toString());
      }
    }

    // Initialize Tenderdash

    const tenderdashImage = config.get('platform.drive.tenderdash.docker.image');

    await docker.pull(tenderdashImage);

    const writableStream = new WritableStream();

    const command = [
      '/usr/bin/tenderdash init > /dev/null',
      'echo "["',
      'cat $TMHOME/config/priv_validator_key.json',
      'echo ","',
      'cat $TMHOME/config/node_key.json',
      'echo ","',
      'cat $TMHOME/config/genesis.json',
      'echo "]"',
    ].join('&&');

    const [result] = await docker.run(
      tenderdashImage,
      [],
      writableStream,
      {
        Entrypoint: ['sh', '-c', command],
        HostConfig: {
          AutoRemove: true,
          Binds: [`${volumeNameFullName}:/tenderdash/data`],
        },
      },
    );

    if (result.StatusCode !== 0) {
      throw new Error(result.Error || writableStream.toString());
    }

    return JSON.parse(writableStream.toString());
  }

  return initializeTenderdashNode;
}

module.exports = initializeTenderdashNodeFactory;
