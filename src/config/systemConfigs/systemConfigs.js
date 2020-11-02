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
      password: 'rpcpassword',
    },
    spork: {
      address: null,
      privateKey: null
    },
    masternode: {
      enable: true,
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
          image: 'dashpay/dapi:0.16',
        },
      },
      insight: {
        docker: {
          image: 'dashpay/insight-api:3.0.1',
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
          image: 'dashpay/drive:0.16',
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
    version: null,
  },
  compose: {
    file: 'docker-compose.yml:docker-compose.platform.yml',
  },
  nodeEnv: 'production',
  loggingLevel: 'info',
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
        image: 'dashpay/dashd:0.16',
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
      spork: {
        address: 'yQuAu9YAMt4yEiXBeDp3q5bKpo7jsC2eEj',
      },
    },
    platform: {
      dpns: {
        contractId: '3VvS19qomuGSbEYWbTsRzeuRgawU3yK4fPMzLrbV62u8',
        ownerId: 'Gxiu28Lzfj66aPBCxD7AgTbbauLf68jFLNibWGU39Fuh',
      },
    },
    network: {
      name: NETWORKS.EVONET,
      version: 8,
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
