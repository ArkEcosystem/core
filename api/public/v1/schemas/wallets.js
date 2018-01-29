module.exports = {
  open: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      }
    },
    required: ['secret']
  },
  getBalance: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address'
      }
    },
    required: ['address']
  },
  getPublicKey: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address'
      }
    },
    required: ['address']
  },
  generatePublicKey: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1
      }
    },
    required: ['secret']
  },
  getDelegates: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address'
      }
    },
    required: ['address']
  },
  addDelegates: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      secondSecret: {
        type: 'string',
        minLength: 1
      }
    }
  },
  getWallet: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address'
      }
    },
    required: ['address']
  },
  top: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  }
};
