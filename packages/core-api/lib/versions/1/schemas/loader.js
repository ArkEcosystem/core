/**
 * The AJV schema for the loader endpoints.
 * @type {Object}
 */
module.exports = {
  loadSignatures: {
    type: 'object',
    properties: {
      signatures: {
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['signatures'],
  },
  loadUnconfirmedTransactions: {
    type: 'object',
    properties: {
      transactions: {
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['transactions'],
  },
  getNetwork: {
    peers: {
      type: 'object',
      properties: {
        peers: {
          type: 'array',
          uniqueItems: true,
        },
      },
      required: ['peers'],
    },
    peer: {
      type: 'object',
      properties: {
        ip: {
          type: 'string',
          format: 'ip',
        },
        port: {
          type: 'integer',
          minimum: 1,
          maximum: 65535,
        },
        state: {
          type: 'integer',
          minimum: 0,
          maximum: 3,
        },
        os: {
          type: 'string',
        },
        version: {
          type: 'string',
        },
      },
      required: ['ip', 'port'],
    },
    height: {
      type: 'object',
      properties: {
        height: {
          type: 'integer',
          minimum: 0,
        },
        id: {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['height'],
    },
  },
}
