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
      seeds: [],
    },
    rpc: {
      port: 20002,
      user: 'dashrpc',
      password: 'rpcpassword'
    },
    sporkAddr: null,
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
        docker: {
          image: 'envoyproxy/envoy:v1.14-latest',
        },
      },
      nginx: {
        http: {
          port: 3000
        },
        grpc: {
          port: 3010
        },
        docker: {
          image: 'nginx:latest',
        },
      },
      api: {
        docker: {
          image: 'dashpay/dapi:0.15-dev',
        },
      },
      insight: {
        docker: {
          image: 'dashpay/insight-api:latest',
        },
      },
    },
    drive: {
      mongodb: {
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
    version: null,
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
      version: null,
    },
  }),
  evonet: lodashMerge({}, baseConfig, {
    description: 'node with Evonet configuration',
    core: {
      docker: {
        image: 'dashpay/dashd:0.15',
      },
      p2p: {
        seeds: [
          {
            host: 'seed-1.evonet.networks.dash.org',
            port: 20001,
          },
          {
            host: 'seed-2.evonet.networks.dash.org',
            port: 20001,
          },
          {
            host: 'seed-3.evonet.networks.dash.org',
            port: 20001,
          },
          {
            host: 'seed-4.evonet.networks.dash.org',
            port: 20001,
          },
          {
            host: 'seed-5.evonet.networks.dash.org',
            port: 20001,
          },
        ],
      },
      sporkAddr: 'yQuAu9YAMt4yEiXBeDp3q5bKpo7jsC2eEj',
    },
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
      version: null,
    },
    compose: {
      file: 'docker-compose.yml',
    },
  }),
};
