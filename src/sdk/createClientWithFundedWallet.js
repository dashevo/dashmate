const Dash = require('dash');

const fundAccount = require('./fundAccount');

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

  const faucetWallet = new Dash.Client({
    ...clientOpts,
    wallet: {
      privateKey: faucetPrivateKey,
    },
  });
  const faucetAccount = await faucetWallet.getWalletAccount();

  const walletToFund = new Dash.Client({
    ...clientOpts,
    wallet: {
      mnemonic: null,
    },
  });
  const accountToFund = await walletToFund.getWalletAccount();

  const amount = 40000;

  await fundAccount(faucetAccount, accountToFund, amount);

  return walletToFund;
}

module.exports = createClientWithFundedWallet;
