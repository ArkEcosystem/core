const container = require('@arkecosystem/core-container')

const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

/**
 * The AJV schema for the delegate endpoints.
 * @type {Object}
 */
module.exports = {
  forgingStatus: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey',
      },
    },
    required: ['publicKey'],
  },
  getDelegate: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
      },
      username: {
        type: 'string',
      },
    },
  },
  search: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        minLength: 1,
        maxLength: 20,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['q'],
  },
  getVoters: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey',
      },
    },
    required: ['publicKey'],
  },
  getDelegates: {
    type: 'object',
    properties: {
      orderBy: {
        type: 'string',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: lastBlock
          ? container
            .resolvePlugin('config')
            .getConstants(lastBlock.data.height).activeDelegates
          : 51,
      },
      offset: {
        type: 'integer',
        minimum: 0,
      },
    },
  },
  getForgedByAccount: {
    type: 'object',
    properties: {
      generatorPublicKey: {
        type: 'string',
        format: 'publicKey',
      },
    },
    required: ['generatorPublicKey'],
  },
}
