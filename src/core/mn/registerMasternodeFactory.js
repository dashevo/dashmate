const path = require('path');
const { Transaction, PrivateKey } = require('@dashevo/dashcore-lib');
const { PrivateKey: BlsPrivateKey } = require('bls-signatures');
const crypto = require('crypto');

const MASTERNODE_DASH_AMOUNT = 1000;
const SATOSHI_MULTIPLIER = 10 ** 8;

/**
 * Register masternode
 *
 * @param {Object} logger
 * @property {function} log
 * @property {function} info
 * @property {function} warn
 * @property {function} error
 * @param {Docker} docker
 * @param {Object} compose
 * @param {RpcClient} coreClient
 * @param {waitForCoreStart} waitForCoreStart
 * @param {waitForCoreSync} waitForCoreSync
 * @param {waitForConfirmations} waitForConfirmations
 * @param {getInputsForAmount} getInputsForAmount
 * @returns {registerMasternode}
 */
function registerMasternodeFactory(
  logger,
  docker,
  compose,
  coreClient,
  waitForCoreStart,
  waitForCoreSync,
  waitForConfirmations,
  getInputsForAmount,
) {
  /**
   * @typedef registerMasternode
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
    const options = {
      cwd: path.join(__dirname, '../../../'),
      config: 'docker-compose.yml',
      composeOptions: [
        '--env-file', `.env.${preset}`,
      ],
      commandOptions: [
        '--publish=20002:20002',
        '--detach',
      ],
    };

    const command = 'dashd -conf=/dash/.dashcore/dash.conf -datadir=/dash/data --disablewallet=0 -port=20001';

    let container;

    try {
      // Start dash core
      let containerName;
      let exitCode;

      try {
        ({ out: containerName, exitCode } = await compose.run('core', command, options));
      } catch (e) {
        throw new Error(`Cannot start service:\n Exit code: ${e.exitCode}\n Error: ${e.err}\n Output: ${e.out}\n`);
      }

      if (exitCode !== 0) {
        throw new Error('Cannot start service');
      }

      container = docker.getContainer(containerName.trim());

      const network = 'testnet';

      // wait dash core to start
      await waitForCoreStart();

      await coreClient.importPrivKey(fundSourcePrivateKey);

      // wait dash core to be synced
      if (preset !== 'local') {
        await waitForCoreSync();
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

      logger.info(`Fund balance is ${balance / SATOSHI_MULTIPLIER}`);

      if (balance / SATOSHI_MULTIPLIER < MASTERNODE_DASH_AMOUNT) {
        throw new Error('Needs wallet with more than 1000 dash');
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

      logger.info(`Sending ${amountToSend / SATOSHI_MULTIPLIER} dash to owner`);

      const { result: collateralHash } = await coreClient.sendrawtransaction(
        transaction.serialize(),
      );

      logger.info(`Collateral tx ${collateralHash}`);
      logger.info('Money successfully sent');
      logger.info('Waiting for 15 confirmations');

      // wait for 15 confirmations
      await waitForConfirmations(preset, collateralHash, 15);

      // we need to have height >= 1000
      if (preset === 'local') {
        const { result: blocks } = await coreClient.getBlockCount();
        if (blocks < 1000) {
          logger.log(`Generating ${blocks} blocks to reach 1000th block`);

          await coreClient.generate(1000 - blocks);
        }
      }

      // get collateral index
      const { result: masternodeOutputs } = await coreClient.masternode('outputs');

      const collateralIndex = parseInt(masternodeOutputs[collateralHash], 10);

      // register masternode with protx
      logger.info('Registering masternode');

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

      logger.info(`Masternode registered with tx ${protx}`);
      logger.info(`Add this bls private key to your config: ${operator.privateKey}`);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new Error(JSON.stringify(e));
      } else {
        throw e;
      }
    } finally {
      // close dash core
      if (container) {
        const { State: state } = await container.inspect();

        if (state === 'running') {
          await container.stop();
          await container.remove();
        }
      }
    }
  }

  return registerMasternode;
}

module.exports = registerMasternodeFactory;
