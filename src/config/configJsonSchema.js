const NETWORKS = require('../networks');

module.exports = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  definitions: {
    docker: {
      type: 'object',
      properties: {
        docker: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
            },
          },
          required: ['image'],
          additionalProperties: false,
        },
      },
      required: ['docker'],
    },
    port: {
      type: 'integer',
      minimum: 0,
    },
  },
  properties: {
    description: {
      type: ['string', 'null'],
    },
    core: {
      type: 'object',
      properties: {
        docker: {
          $ref: '#/definitions/docker/properties/docker',
        },
        p2p: {
          type: 'object',
          properties: {
            port: {
              $ref: '#/definitions/port',
            },
          },
          required: ['port'],
          additionalProperties: false,
        },
        rpc: {
          type: 'object',
          properties: {
            port: {
              $ref: '#/definitions/port',
            },
            user: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
          required: ['port', 'user', 'password'],
          additionalProperties: false,
        },
        zmq: {
          type: 'object',
          properties: {
            port: {
              $ref: '#/definitions/port',
            },
          },
          required: ['port'],
          additionalProperties: false,
        },
        masternode: {
          type: 'object',
          properties: {
            operator: {
              type: 'object',
              properties: {
                privateKey: {
                  type: ['string', 'null'],
                },
              },
              required: ['privateKey'],
              additionalProperties: false,
            },
          },
          required: ['operator'],
          additionalProperties: false,
        },
        miner: {
          type: 'object',
          properties: {
            enable: {
              type: 'boolean',
            },
            interval: {
              type: 'string',
              pattern: '^[0-9]+(.[0-9]+)?(m|s|h)$',
            },
            address: {
              type: ['string', 'null'],
            },
          },
          required: ['enable', 'interval', 'address'],
          additionalProperties: false,
        },
      },
      required: ['docker', 'p2p', 'rpc', 'zmq', 'masternode', 'miner'],
      additionalProperties: false,
    },
    platform: {
      type: 'object',
      properties: {
        dapi: {
          type: 'object',
          properties: {
            envoy: {
              properties: {
                docker: {
                  $ref: '#/definitions/docker/properties/docker',
                },
                port: {
                  $ref: '#/definitions/port',
                },
              },
              required: ['port', 'docker'],
              additionalProperties: false,
            },
            nginx: {
              $ref: '#/definitions/docker',
            },
            api: {
              properties: {
                docker: {
                  $ref: '#/definitions/docker/properties/docker',
                },
                jsonrpc: {
                  type: 'object',
                  properties: {
                    port: {
                      $ref: '#/definitions/port',
                    },
                  },
                  required: ['port'],
                  additionalProperties: false,
                },
                grpc: {
                  type: 'object',
                  properties: {
                    port: {
                      $ref: '#/definitions/port',
                    },
                  },
                  required: ['port'],
                  additionalProperties: false,
                },
              },
              required: ['docker', 'jsonrpc', 'grpc'],
              additionalProperties: false,
            },
            insight: {
              properties: {
                docker: {
                  $ref: '#/definitions/docker/properties/docker',
                },
                port: {
                  $ref: '#/definitions/port',
                },
              },
              required: ['port', 'docker'],
              additionalProperties: false,
            },
            txfilterstream: {
              type: 'object',
              properties: {
                port: {
                  $ref: '#/definitions/port',
                },
              },
              required: ['port'],
              additionalProperties: false,
            },
          },
          required: ['envoy', 'nginx', 'api', 'insight', 'txfilterstream'],
          additionalProperties: false,
        },
        drive: {
          type: 'object',
          properties: {
            mongodb: {
              properties: {
                docker: {
                  $ref: '#/definitions/docker/properties/docker',
                },
                port: {
                  $ref: '#/definitions/port',
                },
              },
              required: ['port', 'docker'],
              additionalProperties: false,
            },
            abci: {
              $ref: '#/definitions/docker',
            },
            tendermint: {
              properties: {
                docker: {
                  $ref: '#/definitions/docker/properties/docker',
                },
                p2p: {
                  type: 'object',
                  properties: {
                    port: {
                      $ref: '#/definitions/port',
                    },
                  },
                  required: ['port'],
                  additionalProperties: false,
                },
                rpc: {
                  type: 'object',
                  properties: {
                    port: {
                      $ref: '#/definitions/port',
                    },
                  },
                  required: ['port'],
                  additionalProperties: false,
                },
              },
              required: ['docker', 'p2p', 'rpc'],
            },
          },
          required: ['mongodb', 'abci', 'tendermint'],
          additionalProperties: false,
        },
        dpns: {
          type: 'object',
          properties: {
            contractId: {
              type: ['string', 'null'],
            },
            ownerId: {
              type: ['string', 'null'],
            },
          },
          required: ['contractId', 'ownerId'],
          additionalProperties: false,
        },
      },
      required: ['dapi', 'drive', 'dpns'],
      additionalProperties: false,
    },
    externalIp: {
      type: ['string', 'null'],
      format: 'ipv4',
    },
    network: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: Object.values(NETWORKS),
        },
        version: {
          type: 'integer',
          minimum: 0,
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    compose: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
        },
      },
      required: ['file'],
      additionalProperties: false,
    },
  },
  required: ['description', 'core', 'platform', 'externalIp', 'network', 'compose'],
  additionalProperties: false,
};
