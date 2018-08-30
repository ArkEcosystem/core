'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

const { Block } = require('@arkecosystem/crypto').models
const requestIp = require('request-ip')

const schema = require('../schemas/blocks')
const monitor = require('../../../../monitor')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const database = container.resolvePlugin('database')
    const blockchain = container.resolvePlugin('blockchain')

    let reqBlockHeight = parseInt(request.query.lastBlockHeight)
    let data = []

    if (!request.query.lastBlockHeight || Number.isNaN(reqBlockHeight)) {
      data.push(blockchain.getLastBlock())
    } else {
      data = await database.getBlocks(parseInt(reqBlockHeight) + 1, 400)
    }

    logger.info(`${requestIp.getClientIp(request)} has downloaded ${data.length} blocks from height ${request.query.lastBlockHeight}`)

    return { data }
  },
  options: {
    validate: schema.index
  }
}

/**
 * @type {Object}
 */
exports.store = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
 async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    const block = request.payload.block

    if (blockchain.pingBlock(block)) {
      return h.response(null).code(202)
    }

    // already got it?
    const lastDownloadedBlock = blockchain.getLastDownloadedBlock()

    // Are we ready to get it?
    if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
      return h.response(null).code(202)
    }

    const b = new Block(block)

    if (!b.verification.verified) {
      throw new Error('invalid block received')
    }

    blockchain.pushPingBlock(b.data)

    if (b.headerOnly) {
      // let missingIds = []
      let transactions = []
      // if (transactionPool) {
      //   transactions = block.transactionIds.map(async id => await transactionPool.getTransaction(id) || id)
      //   missingIds = transactions.filter(tx => !tx.id)
      // } else {
      //   missingIds = block.transactionIds.slice(0)
      // }
      // if (missingIds.length > 0) {

      let peer = await monitor.getPeer(requestIp.getClientIp(request))

      // only for test because it can be used for DDOS attack
      if (!peer && process.env.NODE_ENV === 'test_p2p') {
        peer = await monitor.getRandomPeer()
      }

      if (!peer) {
        return h.response(null).code(400)
      }

      transactions = await peer.getTransactionsFromIds(block.transactionIds)

      // issue on v1, using /api/ instead of /peer/
      if (transactions.length < block.transactionIds.length) {
        transactions = await peer.getTransactionsFromBlock(block.id)
      }

      // reorder them correctly
      block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id))
      logger.debug(`Found missing transactions: ${block.transactions.map(tx => tx.id)}`)

      if (block.transactions.length !== block.numberOfTransactions) {
        return h.response(null).code(400)
      }
    }
    // } else return { success: false }

    block.ip = requestIp.getClientIp(request)
    blockchain.queueBlock(block)

    return h.response(null).code(201)
  },
  options: {
    validate: schema.store
  }
}

/**
 * @type {Object}
 */
exports.common = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const database = container.resolvePlugin('database')
    const blockchain = container.resolvePlugin('blockchain')

    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    const commonBlock = await database.getCommonBlock(ids)

    return {
      data: {
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getLastBlock().data.height
      }
    }
  },
  options: {
    validate: schema.index
  }
}
