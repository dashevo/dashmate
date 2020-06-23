const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @return {startNode}
 */
function startNodeFactory(dockerCompose) {
  /**
   * @typedef {startNode}
   * @param {string} preset
   * @param {string} externalIp
   * @param {number} coreP2pPort
   * @param {boolean} isFullNode
   * @param {string} operatorPrivateKey
   * @param {string} driveImageBuildPath
   * @param {string} dapiImageBuildPath
   * @return {Promise<void>}
   */
  async function startNode(
    preset,
    externalIp,
    coreP2pPort,
    isFullNode,
    operatorPrivateKey,
    driveImageBuildPath,
    dapiImageBuildPath,
  ) {
    let CORE_MASTERNODE_BLS_PRIV_KEY;

    if (operatorPrivateKey) {
      CORE_MASTERNODE_BLS_PRIV_KEY = operatorPrivateKey;
    }

    if (isFullNode) {
      CORE_MASTERNODE_BLS_PRIV_KEY = '';
    }

    const envs = {
      CORE_MASTERNODE_BLS_PRIV_KEY,
      CORE_P2P_PORT: coreP2pPort,
      CORE_EXTERNAL_IP: externalIp,
      DRIVE_IMAGE_BUILD_PATH: driveImageBuildPath,
      DAPI_IMAGE_BUILD_PATH: dapiImageBuildPath,
    };

    if (driveImageBuildPath || dapiImageBuildPath) {
      if (preset === 'testnet') {
        throw new Error('You can\'t use drive-image-build-path and dapi-image-build-path options with testnet preset');
      }

      const envFile = path.join(__dirname, '..', '..', `.env.${preset}`);
      const envRawData = await fs.readFile(envFile);
      let { COMPOSE_FILE: composeFile } = dotenv.parse(envRawData);

      if (driveImageBuildPath) {
        composeFile = `${composeFile}:docker-compose.platform.build-drive.yml`;
      }

      if (dapiImageBuildPath) {
        composeFile = `${composeFile}:docker-compose.platform.build-dapi.yml`;
      }

      envs.COMPOSE_FILE = composeFile;
    }

    return dockerCompose.up(preset, envs);
  }

  return startNode;
}

module.exports = startNodeFactory;
