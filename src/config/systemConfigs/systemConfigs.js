const lodashMerge = require('lodash.merge');

const NETWORKS = require('../../networks');

const baseConfig = {
  description: 'base config for use as template',
  core: {
    docker: {
      image: 'dashpay/dashd:0.16',
    },
    p2p: {
      port: 20001,
    },
    rpc: {
      port: 20002,
      user: 'dashrpc',
      password: 'rpcpassword'
    },
    zmq: {
      port: 29998,
    },
    masternode: {
      operator: {
        privateKey: null,
      },
    },
    miner: {
      enable: false,
      interval: '2.5m',
      address: null,
    },
  },
  platform: {
    dapi: {
      envoy: {
        port: 8080,
        docker: {
          image: 'envoyproxy/envoy:v1.14-latest',
        },
      },
      nginx: {
        docker: {
          image: 'nginx:latest',
        },
      },
      api: {
        jsonrpc: {
          port: 3004,
        },
        grpc: {
          port: 3005,
        },
        docker: {
          image: 'dashpay/dapi:0.15-dev',
        },
      },
      insight: {
        port: 3001,
        docker: {
          image: 'dashpay/insight-api:latest',
        },
      },
      txfilterstream: {
        port: 3006,
      },
    },
    drive: {
      mongodb: {
        port: 27017,
        docker: {
          image: 'mongo:4.2',
        },
      },
      abci: {
        docker: {
          image: 'dashpay/drive:0.15-dev',
        },
      },
      tendermint: {
        p2p: {
          port: 26656,
        },
        rpc: {
          port: 26657,
        },
        docker: {
          image: 'dashpay/tendermint:v0.32.12',
        },
      },
    },
    dpns: {
      contractId: null,
      ownerId: null,
    },
  },
  externalIp: null,
  network: {
    name: NETWORKS.TESTNET,
  },
  compose: {
    file: 'docker-compose.yml:docker-compose.platform.yml',
  },
};

module.exports = {
  base: baseConfig,
  local: lodashMerge({}, baseConfig, {
    description: 'standalone node for local development',
    externalIp: '127.0.0.1',
    network: {
      name: NETWORKS.LOCAL,
    },
  }),
  evonet: lodashMerge({}, baseConfig, {
    description: 'node with Evonet configuration',
    platform: {
      dpns: {
        contractId: 'FiBkhut4LFPMJqDWbZrxVeT6Mr6LsH3mTNTSSHJY2ape',
        ownerId: '6UZ9jAodWiFxRg82HuA1Lf3mTh4fTGSiughxqkZX5kUA',
      },
    },
    network: {
      name: NETWORKS.EVONET,
      version: 6,
    },
  }),
  testnet: lodashMerge({}, baseConfig, {
    description: 'node with testnet configuration',
    core: {
      p2p: {
        port: 19999,
      },
      rpc: {
        port: 19998,
      },
    },
    network: {
      name: NETWORKS.TESTNET,
    },
    compose: {
      file: 'docker-compose.yml',
    },
  }),
};
