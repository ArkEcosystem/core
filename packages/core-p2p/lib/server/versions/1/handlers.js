'use strict'

const container = require('@arkecosystem/core-container')
const { Block } = require('@arkecosystem/crypto').models
const logger = container.resolvePlugin('logger')
const requestIp = require('request-ip')
const transactionPool = container.resolvePlugin('transactionPool')
const { slots } = require('@arkecosystem/crypto')
const schema = require('./schema')
// const Promise = require('bluebird')

/**
 * @type {Object}
 */
exports.getPeers = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    try {
      const peers = request.server.app.p2p.getPeers()
        .map(peer => peer.toBroadcastInfo())
        .sort(() => Math.random() - 0.5)

      return {
        success: true,
        peers
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPeers
      }
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
  handler (request, h) {
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock(true)

    return {
      success: true,
      height: lastBlock.height,
      id: lastBlock.id
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getHeight
      }
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
        lastBlockHeight: blockchain.getLastBlock(true).height
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

/**
 * @type {Object}
 */
exports.getTransactionsFromIds = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    try {
      const transactionIds = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))
      const transactions = await container.resolvePlugin('database').getTransactionsFromIds(transactionIds)

      return { success: true, transactions: transactions }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactionsFromIds
      }
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
  handler (request, h) {
    return { success: true, transactions: [] }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactions
      }
    }
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
  handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')
    let lastBlock = null
    if (blockchain) {
      lastBlock = blockchain.getLastBlock()
    }

    if (!lastBlock) {
      return {
        success: false,
        message: 'Node is not ready'
      }
    }

    return {
      success: true,
      height: lastBlock.data.height,
      forgingAllowed: slots.isForgingAllowed(),
      currentSlot: slots.getSlotNumber(),
      header: lastBlock.getHeader()
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getStatus
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
 async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')
    if (!blockchain) return { success: false }
    try {
      if (!request.payload || !request.payload.block) {
        return { success: false }
      }

      const block = request.payload.block

      if (blockchain.pingBlock(block)) return {success: true}
      // already got it?
      const lastDownloadedBlock = blockchain.getLastDownloadedBlock()

      // Are we ready to get it?
      if (lastDownloadedBlock.data.height + 1 !== block.height) return { success: true }
      const b = new Block(block)
      if (!b.verification.verified) throw new Error('invalid block received')
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

          if (!peer) return { success: false }

          transactions = await peer.getTransactionsFromIds(block.transactionIds)
          // issue on v1, using /api/ instead of /peer/
          if (transactions.length < block.transactionIds.length) transactions = await peer.getTransactionsFromBlock(block.id)

          // reorder them correctly
          block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id))
          logger.debug('found missing transactions: ' + JSON.stringify(block.transactions))
          if (block.transactions.length !== block.numberOfTransactions) return { success: false }
        }
      // } else return { success: false }
      block.ip = requestIp.getClientIp(request)
      blockchain.queueBlock(block)
      return { success: true }
    } catch (error) {
      console.log(error)
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
exports.postTransactions = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    if (!request.payload || !request.payload.transactions || !transactionPool) {
      return {
        success: false,
        transactionIds: []
      }
    }
    await transactionPool.guard.validate(request.payload.transactions)
    // TODO: Review throttling of v1
    if (transactionPool.guard.hasAny('accept')) {
      logger.info(`Received ${transactionPool.guard.accept.length} new transactions`)
      transactionPool.addTransactions(transactionPool.guard.accept)
    }

    if (!request.payload.isBroadCasted && transactionPool.guard.hasAny('broadcast')) {
      container
        .resolvePlugin('p2p')
        .broadcastTransactions(transactionPool.guard.broadcast)
    }

    return {
      success: true,
      transactionIds: transactionPool.guard.getIds('accept')
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        payloadSchema: schema.postTransactions
      }
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
  async handler (request, h) {
    try {
      const blocks = await container.resolvePlugin('database').getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)
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
