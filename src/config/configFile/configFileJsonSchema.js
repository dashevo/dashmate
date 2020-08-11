module.exports = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    currentConfigName: {
      type: ['string', 'null'],
    },
    configs: {
      type: 'object',
    },
  },
  required: ['currentConfigName', 'configs'],
  additionalProperties: false,
};
