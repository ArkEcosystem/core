'use strict'

const Boom = require('boom')
const requestIp = require('request-ip')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

const { Block } = require('@arkecosystem/crypto').models

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

    let height = parseInt(request.query.height)
    let data = []

    if (Number.isNaN(height)) {
      data.push(blockchain.getLastBlock())
    } else {
      data = await database.getBlocks(parseInt(height) + 1, 400)
    }

    logger.info(`${requestIp.getClientIp(request)} has downloaded ${data.length} blocks from height ${request.query.height}`)

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

    if (blockchain.pingBlock(request.payload.block)) {
      return h.response(null).code(202)
    }

    // already got it?
    const lastDownloadedBlock = blockchain.getLastDownloadedBlock()

    // Are we ready to get it?
    if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== request.payload.block.height) {
      return h.response(null).code(202)
    }

    const block = new Block(request.payload.block)

    if (!block.verification.verified) {
      return Boom.badData()
    }

    blockchain.pushPingBlock(block.data)

    if (block.headerOnly) {
      let transactions = []

      let peer = await monitor.getPeer(requestIp.getClientIp(request))

      // NOTE: only for test because it can be used for DDOS attack
      if (!peer && process.env.NODE_ENV === 'test_p2p') {
        peer = await monitor.getRandomPeer()
      }

      if (!peer) {
        return Boom.badRequest()
      }

      transactions = await peer.getTransactionsFromIds(block.transactionIds)

      // NOTE: issue on v1, using /api/ instead of /peer/
      if (transactions.length < block.transactionIds.length) {
        transactions = await peer.getTransactionsFromBlock(block.id)
      }

      // NOTE: reorder them correctly
      block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id))
      logger.debug(`Found missing transactions: ${block.transactions.map(tx => tx.id)}`)

      if (block.transactions.length !== block.numberOfTransactions) {
        return Boom.badRequest()
      }
    }

    block.ip = requestIp.getClientIp(request)

    blockchain.queueBlock(request.payload.block)

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

    const ids = request.query.blocks.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    const commonBlock = await database.getCommonBlock(ids)

    return {
      data: {
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getLastBlock().data.height
      }
    }
  },
  options: {
    validate: schema.common
  }
}
