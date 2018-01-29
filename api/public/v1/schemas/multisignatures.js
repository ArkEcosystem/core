module.exports = {
  getWallets: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  pending: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  sign: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      secondSecret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      transactionId: {
        type: 'string'
      }
    },
    required: ['transactionId', 'secret']
  },
  addMultisignature: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      secondSecret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      min: {
        type: 'integer',
        minimum: 1,
        maximum: 16
      },
      lifetime: {
        type: 'integer',
        minimum: 1,
        maximum: 72
      },
      keysgroup: {
        type: 'array',
        minLength: 1,
        maxLength: 10
      }
    },
    required: ['min', 'lifetime', 'keysgroup', 'secret']
  }
};
