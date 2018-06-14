'use strict'

/**
 * @type {Object}
 */
module.exports = {
  getStatus: {
    id: 'GET:/peer/status',
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
    id: 'GET:/peer/height',
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
    id: 'POST:/peer/transactions',
    type: 'object'
  },
  getTransactions: {
    id: 'GET:/peer/transactions',
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
    id: 'POST:/peer/transactionsFromIds',
    type: 'object'
  },
  getBlocks: {
    id: 'GET:/peer/blocks',
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
    id: 'POST:/peer/blocks',
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
    id: 'GET:/peer/block',
    type: 'object'
  },
  getCommonBlock: {
    id: 'GET:/peer/blocks/common',
    type: 'object'
  },
  getPeers: {
    id: 'GET:/peer/list',
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
  })
}
