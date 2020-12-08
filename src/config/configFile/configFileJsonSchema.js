module.exports = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    configVersion: {
      type: 'string',
    },
    defaultConfigName: {
      type: ['string', 'null'],
    },
    configs: {
      type: 'object',
    },
  },
  required: ['configVersion', 'defaultConfigName', 'configs'],
  additionalProperties: false,
};
