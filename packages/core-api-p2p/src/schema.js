'use strict';

const ajv = new (require('ajv'))()

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  'GET:/peer/status': ajv.compile({
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
  }),
  'GET:/peer/height': ajv.compile({
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
  }),
  'POST:/peer/transactions': ajv.compile({
    id: 'POST:/peer/transactions',
    type: 'object'
  }),
  'GET:/peer/transactions': ajv.compile({
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
  }),
  'GET:/peer/transactionsFromIds': ajv.compile({
    id: 'POST:/peer/transactionsFromIds',
    type: 'object'
  }),
  'GET:/peer/blocks': ajv.compile({
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
  }),
  'POST:/peer/blocks': ajv.compile({
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
  }),
  'GET:/peer/block': ajv.compile({
    id: 'GET:/peer/block',
    type: 'object'
  }),
  'GET:/peer/blocks/common': ajv.compile({
    id: 'GET:/peer/blocks/common',
    type: 'object'
  }),
  'GET:/peer/list': ajv.compile({
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
