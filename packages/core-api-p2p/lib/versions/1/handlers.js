'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const blockchainManager = pluginManager.get('blockchain')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

/**
 * @type {Object}
 */
exports.getPeers = {
  handler: async (request, h) => {
    try {
      const peers = await request.server.app.p2p.getPeers()

      const rpeers = peers
        .map(peer => peer.toBroadcastInfo())
        .sort(() => Math.random() - 0.5)

      return {success: true, peers: rpeers}
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getHeight = {
  handler: (request, h) => {
    return {
      success: true,
      height: blockchainManager.getState().lastBlock.data.height,
      id: blockchainManager.getState().lastBlock.data.id
    }
  }
}

/**
 * @type {Object}
 */
exports.getCommonBlock = {
  handler: async (request, h) => {
    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchainManager.getDatabaseConnection().getCommonBlock(ids)

      return {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchainManager.getState().lastBlock.data.height
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getTransactionsFromIds = {
  handler: async (request, h) => {
    const txids = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))

    try {
      const transactions = await blockchainManager.getDatabaseConnection().getTransactionsFromIds(txids)

      return { success: true, transactions: transactions }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getTransactions = {
  handler: (request, h) => {
    return { success: true, transactions: [] }
  }
}

/**
 * @type {Object}
 */
exports.getStatus = {
  handler: (request, h) => {
    const lastBlock = blockchainManager.getState().lastBlock
    if (!lastBlock) {
      return {
        success: false
      }
    } else {
      return {
        success: true,
        height: lastBlock.height,
        forgingAllowed: slots.getSlotNumber() === slots.getSlotNumber(slots.getTime() + slots.interval / 2),
        currentSlot: slots.getSlotNumber(),
        header: lastBlock.getHeader()
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.postBlock = {
  handler: (request, h) => {
    // console.log(request.payload)
    if (!request.payload.block) return { success: false }

    blockchainManager.postBlock(request.payload.block)
    return { success: true }
  }
}

/**
 * @type {Object}
 */
exports.postTransactions = {
  handler: async (request, h) => {
    const transactions = request.payload.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction).toString('hex')))

    blockchainManager.postTransactions(transactions)

    return { success: true, transactionIds: [] }
  }
}

/**
 * @type {Object}
 */
exports.getBlocks = {
  handler: async (request, h) => {
    try {
      const blocks = await blockchainManager.getDatabaseConnection().getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)

      return { success: true, blocks: blocks }
    } catch (error) {
      logger.error(error.stack)
      return h.response({ success: false, error: error }).code(500)
    }
  }
}
