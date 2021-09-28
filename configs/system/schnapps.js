const lodashMerge = require('lodash.merge');
const os = require('os');
const path = require('path');

const {
  NETWORK_DEVNET,
} = require('../../src/constants');

const baseConfig = require('./base');

module.exports = lodashMerge({}, baseConfig, {
  description: 'node with schnapps configuration',
  core: {
    p2p: {
      port: 19999,
      seeds: [
        {
          host: '34.222.133.56',
          port: 20001,
        },
      ],
    },
    rpc: {
      port: 19998,
    },
    spork: {
      address: 'yTrnnUkRXADy7C3CizQ1uCu1Qtd2WAmxNH',
    },
    devnetName: 'schnapps',
  },
  platform: {
    dpns: {
      contract: {
        id: '8F4WqzVuqyYEBMR1AraBuYG1cjk3hqUYdzLSMdYpWLbH',
        blockHeight: 13,
      },
      ownerId: '5DSwyjJiUXArZ42Uj1g7wSPLgWTBYCT3p4pHPmtEDH5b',
    },
    dashpay: {
      contract: {
        id: '8Mpj1D1fSg1AtKoCFBcSg7UTfqChpFTHLQBPVrXUACxC',
        blockHeight: 24,
      },
    },
    featureFlags: {
      contract: {
        id: '4DJgtvrXisjpp3VhCPdw1XHTHLmDD17fr893Mb2yfyzT',
        blockHeight: 30,
      },
      ownerId: '6CXTScS4uht4HxyTAB3PGDPWSw7D4J2q9ZGzLWptC6ZY',
    },
    drive: {
      abci: {
        log: {
          prettyFile: {
            path: path.join(os.tmpdir(), '/testnet-drive-pretty.log'),
          },
          jsonFile: {
            path: path.join(os.tmpdir(), '/testnet-drive-json.log'),
          },
        },
        validatorSet: {
          llmqType: 101,
        },
      },
      tenderdash: {
        p2p: {
          seeds: [
            {
              id: '7f76b991b629b95d37fc568d67215c07a1abf9de',
              host: '34.222.133.56',
              port: 26656,
            },
          ],
        },
        genesis: {
          genesis_time: '2021-07-10T18:23:35.525Z',
          chain_id: 'dash-devnet-schnapps-6',
          initial_height: '0',
          initial_core_chain_locked_height: 3500,
          initial_proposal_core_chain_lock: null,
          consensus_params: {
            block: {
              max_bytes: '22020096',
              max_gas: '-1',
              time_iota_ms: '5000',
            },
            evidence: {
              max_age: '100000',
              max_age_num_blocks: '100000',
              max_age_duration: '172800000000000',
            },
            validator: {
              pub_key_types: ['bls12381'],
            },
            version: {},
          },
          threshold_public_key: null,
          quorum_type: '101',
          quorum_hash: null,
          app_hash: '',
        },
      },
    },
  },
  network: NETWORK_DEVNET,
});
