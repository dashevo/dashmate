module.exports = {
  local: {
    description: 'standalone node for local development',
    core: {
      docker: {
        image: 'dashpay/dashd',
      },
      version: 'latest',
      externalIp: '127.0.0.1',
      p2p: {
        port: 20001,
      },
      masternode: {
        operatorPrivateKey: null,
      },
    },
    platform: {
      dapi: {
        envoy: {
          docker: {
            image: 'envoyproxy/envoy',
          },
          version: 'v1.14-latest',
        },
        nginx: {
          docker: {
            image: 'nginx',
          },
          version: 'latest',
        },
        api: {
          docker: {
            image: 'dashpay/dapi',
          },
          version: '0.14',
        },
        insight: {
          docker: {
            image: 'dashpay/insight-api',
          },
          version: 'latest',
        },
      },
      drive: {
        mongodb: {
          docker: {
            image: 'mongo',
          },
          version: '4.2',
        },
        abci: {
          docker: {
            image: 'dashpay/drive:0.14',
          },
        },
        tendermint: {
          docker: {
            image: 'dashpay/tendermint',
          },
          version: 'v0.32.12',
        },
      },
      dpns: {
        contractId: null,
        ownerId: null,
      },
    },
  },
  evonet: {
    description: 'node with Evonet configuration',
    core: {
      docker: {
        image: 'dashpay/dashd',
      },
      version: '0.15',
      externalIp: null,
      p2p: {
        port: 20001,
      },
      masternode: {
        operatorPrivateKey: null,
      },
    },
    platform: {
      dapi: {
        envoy: {
          docker: {
            image: 'envoyproxy/envoy',
          },
          version: 'v1.14-latest',
        },
        nginx: {
          docker: {
            image: 'nginx',
          },
          version: 'latest',
        },
        api: {
          docker: {
            image: 'dashpay/dapi',
          },
          version: '0.14',
        },
        insight: {
          docker: {
            image: 'dashpay/insight-api',
          },
          version: 'latest',
        },
      },
      drive: {
        mongodb: {
          docker: {
            image: 'mongo',
          },
          version: '4.2',
        },
        abci: {
          docker: {
            image: 'dashpay/drive:0.14',
          },
        },
        tendermint: {
          docker: {
            image: 'dashpay/tendermint',
          },
          version: 'v0.32.12',
        },
      },
      dpns: {
        contractId: 'FiBkhut4LFPMJqDWbZrxVeT6Mr6LsH3mTNTSSHJY2ape',
        ownerId: 'UZ9jAodWiFxRg82HuA1Lf3mTh4fTGSiughxqkZX5kUA',
      },
    },
  },
  testnet: {
    description: 'node with testnet configuration',
    core: {
      docker: {
        image: 'dashpay/dashd',
      },
      version: 'latest',
      externalIp: null,
      p2p: {
        port: 19999,
      },
      masternode: {
        operatorPrivateKey: null,
      },
    },
    platform: {
      dapi: {
        envoy: {
          docker: {
            image: 'envoyproxy/envoy',
          },
          version: 'v1.14-latest',
        },
        nginx: {
          docker: {
            image: 'nginx',
          },
          version: 'latest',
        },
        api: {
          docker: {
            image: 'dashpay/dapi',
          },
          version: '0.14',
        },
        insight: {
          docker: {
            image: 'dashpay/insight-api',
          },
          version: 'latest',
        },
      },
      drive: {
        mongodb: {
          docker: {
            image: 'mongo',
          },
          version: '4.2',
        },
        abci: {
          docker: {
            image: 'dashpay/drive:0.14',
          },
        },
        tendermint: {
          docker: {
            image: 'dashpay/tendermint',
          },
          version: 'v0.32.12',
        },
      },
      dpns: {
        contractId: null,
        ownerId: null,
      },
    },
  },
};
