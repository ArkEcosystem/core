'use strict'

/**
 * @type {Object}
 */
module.exports = {
  getStatus: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      height: {
        type: 'integer',
        minimum: 0
      },
      currentSlot: {
        type: 'integer',
        minimum: 0
      },
      forgingAllowed: {
        type: 'boolean'
      },
      header: {
        type: 'object'
      }
    },
    required: ['success', 'height', 'header', 'currentSlot', 'forgingAllowed']
  },
  getHeight: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      height: {
        type: 'integer',
        minimum: 0
      },
      header: {
        type: 'object'
      }
    },
    required: ['success', 'height', 'header']
  },
  postTransactions: {
    type: 'object'
  },
  getTransactions: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      transactions: {
        type: 'array',
        uniqueItems: true
      }
    },
    required: ['transactions']
  },
  getTransactionsFromIds: {
    type: 'object'
  },
  getBlocks: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      blocks: {
        type: 'array'
      }
    },
    required: ['blocks']
  },
  postBlock: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      blockId: {
        type: 'string'
      }
    },
    required: ['success', 'blockId']
  },
  getBlock: {
    type: 'object'
  },
  getCommonBlocks: {
    type: 'object'
  },
  getPeers: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      },
      peers: {
        type: 'array'
      }
    },
    required: ['peers']
  }
}
