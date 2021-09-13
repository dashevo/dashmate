const os = require('os');
const path = require('path');

const {
  NETWORK_TESTNET,
} = require('../../src/constants');

module.exports = {
  description: 'base config for use as template',
  group: null,
  core: {
    docker: {
      image: 'dashpay/dashd:0.17',
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
      privateKey: null,
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
    sentinel: {
      docker: {
        image: 'dashpay/sentinel:1.6.0',
      },
    },
    debug: 0,
    devnetName: null,
  },
  platform: {
    dapi: {
      envoy: {
        docker: {
          image: 'envoyproxy/envoy:v1.16-latest',
        },
        http: {
          port: 3000,
        },
        grpc: {
          port: 3010,
        },
        rateLimiter: {
          maxTokens: 300,
          tokensPerFill: 150,
          fillInterval: '60s',
          enabled: true,
        },
      },
      api: {
        docker: {
          image: 'dashpay/dapi:0.20',
          build: {
            path: null,
          },
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
          image: 'dashpay/drive:0.20',
          build: {
            path: null,
          },
        },
        log: {
          stdout: {
            level: 'info',
          },
          prettyFile: {
            level: 'silent',
            path: path.join(os.tmpdir(), '/base-drive-pretty.log'),
          },
          jsonFile: {
            level: 'silent',
            path: path.join(os.tmpdir(), '/base-drive-json.log'),
          },
        },
        validatorSet: {
          llmqType: 4,
        },
      },
      tenderdash: {
        docker: {
          image: 'dashpay/tenderdash:0.6.0-dev.2',
        },
        p2p: {
          port: 26656,
          persistentPeers: [],
          seeds: [],
        },
        rpc: {
          port: 26657,
        },
        consensus: {
          createEmptyBlocks: true,
          createEmptyBlocksInterval: '3m',
        },
        log: {
          level: {
            main: 'info',
            state: 'info',
            statesync: 'info',
            '*': 'error',
          },
          format: 'plain',
        },
        nodeKey: {

        },
        genesis: {

        },
        nodeId: null,
      },
    },
    dpns: {
      contract: {
        id: null,
        blockHeight: null,
      },
      ownerId: null,
    },
    dashpay: {
      contract: {
        id: null,
        blockHeight: null,
      },
    },
    featureFlags: {
      contract: {
        id: null,
        blockHeight: null,
      },
      ownerId: null,
    },
  },
  externalIp: null,
  network: NETWORK_TESTNET,
  environment: 'production',
};
