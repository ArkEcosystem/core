'use strict'

/**
 * The AJV schema for the transport endpoints.
 * @type {Object}
 */
module.exports = {
  headers: {
    type: 'object',
    properties: {
      ip: {
        type: 'string',
        format: 'ip'
      },
      port: {
        type: 'integer',
        minimum: 1,
        maximum: 65535
      },
      os: {
        type: 'string',
        maxLength: 64
      },
      nethash: {
        type: 'string',
        maxLength: 64
      },
      version: {
        type: 'string',
        maxLength: 11
      }
    },
    required: ['ip', 'port', 'nethash', 'version']
  },
  commonBlocks: {
    type: 'object',
    properties: {
      ids: {
        type: 'string',
        format: 'csv'
      }
    },
    required: ['ids']
  },
  transactionsFromIds: {
    type: 'object',
    properties: {
      ids: {
        type: 'string',
        format: 'csv'
      }
    },
    required: ['ids']
  },
  blocks: {
    type: 'object',
    properties: {
      lastBlockHeight: {
        type: 'integer'
      }
    }
  },
  block: {
    type: 'object',
    properties: {
      id: {
        type: 'string'
      }
    }
  },
  signatures: {
    type: 'object',
    properties: {
      signature: {
        type: 'object',
        properties: {
          transaction: {
            type: 'string'
          },
          signature: {
            type: 'string',
            format: 'signature'
          }
        },
        required: ['transaction', 'signature']
      }
    },
    required: ['signature']
  },
  transactions: {
    id: 'nodeManager.transactions',
    type: 'array',
    uniqueItems: true,
    required: ['transactions']
  }
};
