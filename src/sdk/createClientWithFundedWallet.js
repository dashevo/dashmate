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
    network: process.env.NETWORK || network,
  };
  const walletOpts = {
    network: process.env.NETWORK || network,
    privateKey: faucetPrivateKey,

  };

  if (seed) {
    clientOpts.seeds = [seed];
    walletOpts.seeds = [seed];
  }

  const faucetWallet = new Dash.Wallet(walletOpts);

  const client = new Dash.Client({
    ...clientOpts,
    wallet: {
      mnemonic: null,
    },
  });

  const amount = 40000;

  await fundWallet(faucetWallet, client.wallet, amount);

  return client;
}

module.exports = createClientWithFundedWallet;
