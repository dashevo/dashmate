/**
 * Get balance of the address
 *
 * @typedef {registerMasternode}
 * @param {CoreService} coreService
 * @param {string} collateralHash
 * @param {string} masternodeExternalIp
 * @param {number} masternodeP2PPort
 * @param {string} ownerAddress
 * @param {string} blsPublicKey
 * @param {string} fundSourceAddress
 * @return {Promise<string>}
 */
async function registerMasternode(
  coreService,
  collateralHash,
  masternodeExternalIp,
  masternodeP2PPort,
  ownerAddress,
  blsPublicKey,
  fundSourceAddress,
) {
  // get collateral index
  const { result: masternodeOutputs } = await coreService.getRpcClient().masternode('outputs');

  const collateralIndex = parseInt(masternodeOutputs[collateralHash], 10);

  const { result: protx } = await coreService.getRpcClient().protx(
    'register',
    collateralHash,
    collateralIndex,
    `${masternodeExternalIp}:${masternodeP2PPort}`,
    ownerAddress,
    blsPublicKey,
    ownerAddress,
    0,
    fundSourceAddress,
  );

  return protx;
}

module.exports = registerMasternode;
