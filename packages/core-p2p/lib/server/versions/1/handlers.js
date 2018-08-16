'use strict'

const container = require('@arkecosystem/core-container')
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')
const { Block } = require('@arkecosystem/crypto').models
const logger = container.resolvePlugin('logger')
const requestIp = require('request-ip')
const transactionPool = container.resolvePlugin('transactionPool')
const { slots, crypto } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

const schema = require('./schema')

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
        .sort((a, b) => a.delay - b.delay)

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
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

    return {
      success: true,
      height: lastBlock.data.height,
      id: lastBlock.data.id
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
      const rows = await container.resolvePlugin('database').getTransactionsFromIds(transactionIds)

      // TODO: v1 compatibility patch. Add transformer and refactor later on
      const transactions = await rows.map(row => {
        let transaction = Transaction.deserialize(row.serialized.toString('hex'))
        transaction.blockId = row.block_id
        transaction.senderId = crypto.getAddress(transaction.senderPublicKey)
        return transaction
      })

      const returnTrx = transactionIds.map((transaction, i) => (transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])))

      return { success: true, transactions: returnTrx }
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
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

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
            return { success: false }
          }

          transactions = await peer.getTransactionsFromIds(block.transactionIds)
          // issue on v1, using /api/ instead of /peer/
          if (transactions.length < block.transactionIds.length) transactions = await peer.getTransactionsFromBlock(block.id)

          // reorder them correctly
          block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id))
          logger.debug(`Found missing transactions: ${block.transactions.map(tx => tx.id)}`)

          if (block.transactions.length !== block.numberOfTransactions) {
            return { success: false }
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

    /**
     * Here we will make sure we memorize the transactions for future requests
     * and decide which transactions are valid or invalid in order to prevent
     * duplication and race conditions caused by concurrent requests.
     */
    const { valid, invalid } = transactionPool.memory.memorize(request.payload.transactions)

    const guard = new TransactionGuard(transactionPool)
    guard.invalid = invalid
    await guard.validate(valid)

    // TODO: Review throttling of v1
    if (guard.hasAny('accept')) {
      logger.info(`Accepted ${guard.accept.length} transactions from ${request.payload.transactions.length} received`)

      logger.verbose(`Accepted transactions: ${guard.accept.map(tx => tx.id)}`)

      await transactionPool.addTransactions(guard.accept)

      transactionPool.memory
        .forget(guard.getIds('accept'))
        .forget(guard.getIds('excess'))
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return {
      success: true,
      transactionIds: guard.getIds('accept')
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
