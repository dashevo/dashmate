const { PrivateKey } = require('@dashevo/dashcore-lib');

const waitForQuorumCommitments = require('./quorum/waitForQuorumCommitements');
const waitForQuorumPhase = require('./quorum/waitForQuorumPhase');
const waitForNodesToHaveTheSameHeight = require('./waitForNodesToHaveTheSameHeight');
const waitForQuorumConnections = require('./quorum/waitForQuorumConnections');
const waitForMasternodeProbes = require('./quorum/waitForMasternodeProbes');

const GENESIS_TIME = 1417713337;

class CoreRegtestNetwork {
  /**
   *
   * @param {CoreService[]} coreServices
   * @param {string} network
   * @param {number} [mocktime]
   * @param network
   */
  constructor(coreServices, network, mocktime= GENESIS_TIME) {
    this.coreServices = coreServices;
    this.mocktime = mocktime;
    this.network = network;
  }

  /**
   *
   * @return {CoreService[]}
   */
  getCoreServices() {
    return this.coreServices;
  }

  /**
   * Bumps mocktime and sets it for all nodes
   * @param {number} time - time to add to the mocktime
   * @return {Promise<void>}
   */
  async bumpMocktime(time) {
    await this.setMockTime(this.mocktime + 1);
  }

  /**
   *
   * @return {RpcClient[]}
   */
  getAllRpcClients() {
    return this.coreServices.map(coreService => coreService.getRpcClient());
  }

  /**
   *
   * @param {number} count - block count to generate
   * @return {Promise<void>}
   */
  async generate(count) {
    const privateKey = new PrivateKey();
    const address = privateKey.toAddress(this.network).toString();

    const rpc = this.coreServices[0].getRpcClient();
    await rpc.generateToAddress(count, address, 10000000);
  }

  /**
   * Sets mock time for all nodes
   *
   * @param {number} mocktime
   * @return {Promise<void>}
   */
  async setMockTime(mocktime) {
    this.mocktime = mocktime;
    for (const rpcClient of this.getAllRpcClients()) {
      await rpcClient.setMockTime(mocktime);
    }
  }

  /**
   *
   * @param {number} [timeout]
   * @return {Promise<void>}
   */
  async waitForAllNodesToHaveTheSameHeight(timeout) {
    return waitForNodesToHaveTheSameHeight(this.getAllRpcClients(), timeout);
  }

  /**
   *
   * @param {string} quorumHash
   * @return {Promise<void>}
   */
  async waitForQuorumCommitments(quorumHash) {
    return waitForQuorumCommitments(this.getAllRpcClients(), quorumHash);
  }

  /**
   *
   * @param {string} quorumHash
   * @param {number} phase
   * @param {number} expectedMembersCount
   * @param {string} [checkReceivedMessagesType]
   * @param {number} [receivedMessagesCount]
   * @param {number} [timeout]
   * @return {Promise<void>}
   */
  async waitForQuorumPhase(quorumHash, phase, expectedMembersCount, checkReceivedMessagesType, receivedMessagesCount= 0, timeout = 300000) {
    return waitForQuorumPhase(this.getAllRpcClients(), quorumHash, phase, expectedMembersCount, checkReceivedMessagesType, receivedMessagesCount);
  }

  /**
   *
   * @param {number} expectedConnectionsCount
   * @return {Promise<void>}
   */
  async waitForQuorumConnections(expectedConnectionsCount) {
    return waitForQuorumConnections(this, expectedConnectionsCount);
  }

  /**
   *
   * @param {number} [timeout]
   * @return {Promise<void>}
   */
  async waitForMasternodeProbes(timeout) {
    return waitForMasternodeProbes(this, timeout);
  }
}

module.exports = CoreRegtestNetwork;
