const Dash = require('dash');

const fundWallet = require('@dashevo/wallet-lib/src/utils/fundWallet');

/**
 *  * Create and fund DashJS client
 *
 * @typedef {createClientWithFundedWallet}
 * @param {string} network
 * @param {string} faucetPrivateKeyString
 * @param {string} [seed]
 * @return {Promise<Client>}
 */
async function createClientWithFundedWallet(network, faucetPrivateKeyString, seed = undefined) {
  // Prepare to fund wallet
  const faucetPrivateKey = faucetPrivateKeyString;

  const clientOpts = {
    network: process.env.NETWORK,
  };

  if (seed) {
    clientOpts.seeds = [seed];
  }

  const faucetClient = new Dash.Client({
    ...clientOpts,
    wallet: {
      privateKey: faucetPrivateKey,
    },
  });
  const { wallet: faucetWallet } = faucetClient;

  const clientToFund = new Dash.Client({
    ...clientOpts,
    wallet: {
      mnemonic: null,
    },
  });
  const { wallet: walletToFund } = clientToFund;

  const amount = 40000;

  await fundWallet(faucetWallet, walletToFund, amount);

  return clientToFund;
}

module.exports = createClientWithFundedWallet;
