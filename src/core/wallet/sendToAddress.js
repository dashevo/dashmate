// TODO move to converter
const SATOSHI_MULTIPLIER = 10 ** 8;

/**
 * Send Dash to address
 *
 * @typedef {sendToAddress}
 * @param {CoreService} coreService
 * @param {string} address
 * @param {number} amount
 * @return {Promise<string>}
 */
async function sendToAddress(coreService, address, amount) {
  const fee = 10000;

  const amountToSend = amount * SATOSHI_MULTIPLIER;

  const inputs = await getInputsForAmount(
    coreClient,
    fundSourceAddress,
    amountToSend + fee,
  );

  const transaction = new Transaction();
  transaction.from(inputs)
    .to(collateralAddress, amountToSend)
    .change(fundSourceAddress)
    .fee(fee)
    .sign(fundSourcePrivateKey);

  const { result: hash } = await coreClient.sendrawtransaction(
    transaction.serialize(),
  );

  return hash;
}

module.exports = sendToAddress;
