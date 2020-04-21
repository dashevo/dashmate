/**
 *  Get inputs to build a transaction
 *
 * @param {RpcClient} coreClient
 * @param {string} address
 * @param {number} amountInSatoshi
 * @returns {Promise<void>}
 */
async function getInputsForAmount(coreClient, address, amountInSatoshi) {
  const { result: utxos } = await coreClient.getAddressUtxos({ addresses: [address] });

  const sortedUtxos = utxos
    .sort((a, b) => a.satoshis > b.satoshis);

  const inputs = [];
  let sum = 0;
  let i = 0;

  do {
    const input = sortedUtxos[i];
    inputs.push(input);
    sum += input.satoshis;

    ++i;
  } while (sum < amountInSatoshi && i < sortedUtxos.length);

  return inputs;
}

module.exports = getInputsForAmount;
