class Masternode {
  constructor(rpcClient, proTxHash) {

    this.rpc = rpcClient;
    this.proTxHash = proTxHash;
  }
}

module.exports = Masternode;
