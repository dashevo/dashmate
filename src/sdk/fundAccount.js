/**
 *
 * @param {Account} fundedAccount
 * @param {Account} accountToFund
 * @param {number} amountInSatoshis
 * @return {Promise<Transaction>}
 */
async function fundAccount(
  fundedAccount,
  accountToFund,
  amountInSatoshis,
) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const { address: addressToFund } = accountToFund.getAddress();

      const fundingTransaction = fundedAccount.createTransaction({
        recipient: addressToFund,
        satoshis: amountInSatoshis,
      });
      const fundingResult = {
        transaction: fundingTransaction,
        transactionId: null,
      };

      accountToFund.on('BALANCE_CHANGED', () => {
        console.log('Balance changed');
        resolve(fundingResult);
      });

      accountToFund.on('FETCHED_CONFIRMED_TRANSACTION', () => {
        console.log('Fetching confirmed tx');
        resolve(fundingResult);
      });

      fundingResult.transactionId = await fundedAccount.broadcastTransaction(fundingTransaction);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = fundAccount;
