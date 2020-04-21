const path = require('path');
const RpcClient = require('@dashevo/dashd-rpc/promise');
const { Transaction, PrivateKey } = require('@dashevo/dashcore-lib');
const { PrivateKey: BlsPrivateKey } = require('bls-signatures');
const crypto = require('crypto');
const compose = require('docker-compose');
const waitForCoreSync = require('../util/waitForCoreSync');
const waitForCoreStart = require('../util/waitForCoreStart');
const getInputsForAmount = require('../util/getInputsForAmount');
const waitForConfirmations = require('../util/waitForConfirmations');

const MASTERNODE_DASH_AMOUNT = 1000;
const SATOSHI_MULTIPLIER = 10 ** 8;

/**
 * Register masternode
 *
 * @param {string} preset
 * @param {string} fundSourcePrivateKey
 * @param {string} masternodeExternalIp
 * @param {number} masternodeP2PPort
 * @returns {Promise<void>}
 */
async function registerMasternode(
  preset,
  fundSourcePrivateKey,
  masternodeExternalIp,
  masternodeP2PPort,
) {
  const composeOptions = {
    cwd: path.join(__dirname, '../'),
    config: 'docker-compose.yml',
    composeOptions: [
      '--env-file', `../.env.${preset}`,
    ],
  };

  try {
    // Start dash core
    await compose.upOne('core', composeOptions);

    const network = 'testnet';

    const dashcoreConfig = {
      protocol: 'http',
      user: 'dashrpc',
      pass: 'password',
      host: '127.0.0.1',
      port: 20002,
    };

    const coreClient = new RpcClient(dashcoreConfig);

    // wait dash core to start
    await waitForCoreStart(coreClient);

    // wait dash core to be synced
    if (preset !== 'local') {
      await waitForCoreSync(coreClient);
    }

    // generate BLS
    const randomBytes = new Uint8Array(crypto.randomBytes(256));
    const operatorPrivateKey = BlsPrivateKey.fromBytes(randomBytes, true);
    const operatorPublicKey = operatorPrivateKey.getPublicKey();
    const operator = {
      publicKey: Buffer.from(operatorPublicKey.serialize()).toString('hex'),
      privateKey: Buffer.from(operatorPrivateKey.serialize()).toString('hex'),
    };

    // generate owner and collateral addresses
    const { result: ownerAddress } = await coreClient.getNewAddress();
    const { result: collateralAddress } = await coreClient.getNewAddress();
    const fundSourceAddress = new PrivateKey(
      fundSourcePrivateKey,
      network,
    ).toAddress(network).toString();

    // check balance
    const { result: { balance } } = await coreClient.getAddressBalance({
      addresses: [fundSourceAddress],
    });

    console.info(`Fund balance is ${balance / SATOSHI_MULTIPLIER}`);

    if (balance / SATOSHI_MULTIPLIER < MASTERNODE_DASH_AMOUNT) {
      console.error('Needs wallet with more than 1000 dash');

      return;
    }

    // send 1000 dash in a single transaction
    const amountToSend = MASTERNODE_DASH_AMOUNT * SATOSHI_MULTIPLIER;
    const fee = 10000;

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

    console.info(`Sending ${amountToSend / SATOSHI_MULTIPLIER} dash to owner`);

    const { result: collateralHash } = await coreClient.sendrawtransaction(transaction.serialize());

    console.info(`Collateral tx ${collateralHash}`);
    console.info('Money successfully sent');
    console.info('Waiting for 15 confirmations');

    // wait for 15 confirmations
    await waitForConfirmations(coreClient, preset, collateralHash, 15);

    // get collateral index
    const { result: masternodeOutputs } = await coreClient.masternode('outputs');


    const { result: { balance: b1 } } = await coreClient.getAddressBalance({
      addresses: [collateralAddress],
    });

    console.log(collateralAddress, b1);

    const collateralIndex = parseInt(masternodeOutputs[collateralHash], 10);

    // register masternode with protx
    console.info('Registering masternode');

    const { result: protx } = await coreClient.protx(
      'register',
      collateralHash,
      collateralIndex,
      `${masternodeExternalIp}:${masternodeP2PPort}`,
      ownerAddress,
      operator.publicKey,
      ownerAddress,
      0,
      fundSourceAddress,
    );

    console.info(`Masternode registered with tx ${protx}`);
    console.info(`Add this bls private key to your config: ${operator.privateKey}`);
  } catch (e) {
    console.error(e);
  } finally {
    // close dash core
    await compose.stopOne('core', composeOptions);
    await compose.rm(composeOptions);
  }
}

module.exports = registerMasternode;
