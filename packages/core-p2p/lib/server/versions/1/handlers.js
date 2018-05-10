'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const blockchain = container.resolvePlugin('blockchain')
const transactionPool = container.resolvePlugin('transactionPool')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

/**
 * @type {Object}
 */
exports.getPeers = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return {
      success: true,
      height: blockchain.getLastBlock(true).height,
      id: blockchain.getLastBlock(true).id
    }
  }
}

/**
 * @type {Object}
 */
exports.getCommonBlock = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchain.database.getCommonBlock(ids)

      return {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getLastBlock(true).height
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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const txids = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))

    try {
      const transactions = await blockchain.database.getTransactionsFromIds(txids)

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return { success: true, transactions: [] }
  }
}

/**
 * @type {Object}
 */
exports.getStatus = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    const lastBlock = blockchain.getLastBlock()
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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    // console.log(request.payload)
    if (!request.payload.block) return { success: false }

    blockchain.queueBlock(request.payload.block)
    return { success: true }
  }
}

/**
 * @type {Object}
 */
exports.postTransactions = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const transactions = request.payload.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction).toString('hex')))
    const isBroadcast = request.payload.broadcast

    // TODO: Review throttling of v1
    const poolThrottle = await transactionPool.determineExceededTransactions(transactions)
    blockchain.postTransactions(poolThrottle.acceptable, isBroadcast)

    return {
      success: true,
      transactionIds: poolThrottle.acceptable.map(tx => tx.id)
    }
  }
}

/**
 * @type {Object}
 */
exports.getBlocks = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    try {
      const blocks = await blockchain.database.getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)

      return { success: true, blocks: blocks }
    } catch (error) {
      logger.error(error.stack)
      return h.response({ success: false, error: error }).code(500)
    }
  }
}
