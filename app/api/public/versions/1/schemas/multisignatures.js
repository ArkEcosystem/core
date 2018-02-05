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
  }
};
