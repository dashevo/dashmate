const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

/**
 *
 * @param {DockerCompose} dockerCompose
 * @return {startNodeTask}
 */
function startNodeTaskFactory(dockerCompose) {

  /**
   * @typedef {startNodeTask}
   * @param {string} preset
   * @param {Object} options
   * @param {string} options.externalIp
   * @param {number} options.coreP2pPort
   * @param {boolean} options.isFullNode
   * @param {string} options.operatorPrivateKey
   * @param {string} options.dpnsContractId
   * @param {string} options.dpnsTopLevelIdentity
   * @param {string} options.driveImageBuildPath
   * @param {string} options.dapiImageBuildPath
   * @return {Promise<void>}
   */
  async function startNodeTask(
    preset,
    {
      externalIp,
      coreP2pPort,
      isFullNode,
      operatorPrivateKey = undefined,
      dpnsContractId = undefined,
      dpnsTopLevelIdentity = undefined,
      driveImageBuildPath = undefined,
      dapiImageBuildPath = undefined,
    },
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

    if (dpnsContractId) {
      envs.DPNS_CONTRACT_ID = dpnsContractId;
    }

    if (dpnsTopLevelIdentity) {
      envs.DPNS_TOP_LEVEL_IDENTITY = dpnsTopLevelIdentity;
    }

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

  return startNodeTask;
}

module.exports = startNodeTaskFactory;
