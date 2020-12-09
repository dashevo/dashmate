const { WritableStream } = require('memory-streams');

/**
 *
 * @param {Docker} docker
 * @return {generateGenesisConfig}
 */
function generateGenesisConfigFactory(docker) {
  /**
   * @typedef {generateGenesisConfig}
   * @param {Config} config
   * @return {Promise<Object>}
   */
  async function generateGenesisConfig(config) {
    const writableStream = new WritableStream();

    const [result] = await docker.run(
      config.get('platform.drive.tenderdash.docker.image'),
      [],
      writableStream,
      {
        Entrypoint: ['sh', '-c', '/usr/bin/tenderdash init > /dev/null && cat $TMHOME/config/genesis.json'],
        HostConfig: {
          AutoRemove: true,
        },
      },
      {},
    );

    if (result.StatusCode !== 0) {
      throw new Error(result.Error);
    }

    return JSON.parse(writableStream.toString());
  }

  return generateGenesisConfig;
}

module.exports = generateGenesisConfigFactory;
