'use strict'

const container = require('@arkecosystem/core-container')
const { Block } = require('@arkecosystem/crypto').models
const requestIp = require('request-ip')
const schema = require('../schema')

const logger = container.resolvePlugin('logger')

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
    try {
      const database = container.resolvePlugin('database')
      const blockchain = container.resolvePlugin('blockchain')
      let reqBlockHeight = parseInt(request.query.lastBlockHeight)
      let blocks = []
      if (!request.query.lastBlockHeight || Number.isNaN(reqBlockHeight)) {
        blocks.push(blockchain.getLastBlock())
      } else {
        blocks = await database.getBlocks(parseInt(reqBlockHeight) + 1, 400)
      }

      logger.info(`${requestIp.getClientIp(request)} has downloaded ${blocks.length} blocks from height ${request.query.lastBlockHeight}`)

      return { success: true, blocks: blocks || [] }
    } catch (error) {
      logger.error(error.stack)

      return h.response({ success: false, error: error }).code(500)
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks
      }
    }
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

    try {
      if (!request.payload || !request.payload.block) {
        return { success: false }
      }

      const block = request.payload.block

      if (blockchain.pingBlock(block)) return {success: true}
      // already got it?
      const lastDownloadedBlock = blockchain.getLastDownloadedBlock()

      // Are we ready to get it?
      if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
        return { success: true }
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
        let peer = await request.server.app.p2p.getPeer(requestIp.getClientIp(request))
        // only for test because it can be used for DDOS attack
        if (!peer && process.env.NODE_ENV === 'test_p2p') {
          peer = await request.server.app.p2p.getRandomPeer()
        }

        if (!peer) {
          return {success: false}
        }

        transactions = await peer.getTransactionsFromIds(block.transactionIds)
        // issue on v1, using /api/ instead of /peer/
        if (transactions.length < block.transactionIds.length) transactions = await peer.getTransactionsFromBlock(block.id)

        // reorder them correctly
        block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id))
        logger.debug(`Found missing transactions: ${block.transactions.map(tx => tx.id)}`)

        if (block.transactions.length !== block.numberOfTransactions) {
          return {success: false}
        }
      }
      // } else return { success: false }

      block.ip = requestIp.getClientIp(request)
      blockchain.queueBlock(block)

      return { success: true }
    } catch (error) {
      logger.error(error)
      return { success: false }
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        payloadSchema: schema.postBlock
      }
    }
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
    if (!request.query.ids) {
      return {
        success: false
      }
    }

    const blockchain = container.resolvePlugin('blockchain')

    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchain.database.getCommonBlock(ids)

      return {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getLastBlock().data.height
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getCommonBlock
      }
    }
  }
}
