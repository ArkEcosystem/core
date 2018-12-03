/**
 * The AJV schema for the account endpoints.
 * @type {Object}
 */
module.exports = {
  getBalance: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address',
      },
    },
    required: ['address'],
  },
  getPublicKey: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address',
      },
    },
    required: ['address'],
  },
  generatePublicKey: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['secret'],
  },
  getDelegates: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address',
      },
    },
    required: ['address'],
  },
  getAccount: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address',
      },
    },
    required: ['address'],
  },
  top: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
      offset: {
        type: 'integer',
        minimum: 0,
      },
    },
  },
}
