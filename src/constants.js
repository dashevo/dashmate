const networks = {
  NETWORK_LOCAL: 'local',
  NETWORK_EVONET: 'evonet',
  NETWORK_TESTNET: 'testnet',
  NETWORK_MAINNET: 'mainnet',
};

const presets = {
  PRESET_TESTNET: 'testnet',
  PRESET_LOCAL: 'local',
  PRESET_EVONET: 'evonet',
};

const nodeTypes = {
  NODE_TYPE_MASTERNODE: 'masternode',
  NODE_TYPE_FULLNODE: 'fullnode',
};

module.exports = {
  ...networks,
  ...presets,
  ...nodeTypes,
  NETWORKS: Object.values(networks),
  PRESETS: Object.values(presets),
  NODE_TYPES: Object.values(nodeTypes),
};
