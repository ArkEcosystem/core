const constants = require('@arkecosystem/core-config').constants

module.exports = {
  forgingStatus: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  getDelegate: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string'
      },
      username: {
        type: 'string'
      }
    }
  },
  search: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        minLength: 1,
        maxLength: 20
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100
      }
    },
    required: ['q']
  },
  getVoters: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  getDelegates: {
    type: 'object',
    properties: {
      orderBy: {
        type: 'string'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: constants.activeDelegates
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  },
  getForgedByWallet: {
    type: 'object',
    properties: {
      generatorPublicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['generatorPublicKey']
  }
}
