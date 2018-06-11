'use strict'

const container = require('@arkecosystem/core-container')
const { Block } = require('@arkecosystem/crypto').models
const logger = container.resolvePlugin('logger')
const requestIp = require('request-ip')
const transactionPool = container.resolvePlugin('transactionPool')
const { slots } = require('@arkecosystem/crypto')

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
    try {
      if (!request.payload || !request.payload.block) {
        return { success: false }
      }

      const block = request.payload.block
      const b = new Block(block)
      if (!b.verification.verified) {
        console.log(b.verification)
        if (block.numberOfTransactions > 0 && block.transactions.length === 0 && block.transactionIds.length === block.numberOfTransactions) {
          let missingIds = []
          const transactions = []
          if (transactionPool) {
            block.transactionIds.forEach(id => {
              const tx = transactionPool.getTransaction(id)
              if (!tx) {
                missingIds.push(id)
                transactions.push(id)
              } else {
                transactions.push(tx)
              }
            })
          } else {
            missingIds = block.transactionIds.slice(0)
          }
          if (missingIds.length > 0) {
            const missingTx = await request.server.app.p2p.getPeer(requestIp.getClientIp(request)).getTransactionsFromIds(missingIds)
            logger.debug('found missing transactions: ' + JSON.parse(missingTx))
          }
        } else return { success: false }
      }

      container.resolvePlugin('blockchain').queueBlock(block)

      return { success: true }
    } catch (error) {
      console.log(error)
      return { success: false }
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
    if (!request.payload || !request.payload.transactions) {
      return {
        success: false,
        transactionIds: []
      }
    }
    await transactionPool.guard.validate(request.payload.transactions)
    // TODO: Review throttling of v1
    if (transactionPool.guard.hasAny('accept')) {
      container
        .resolvePlugin('blockchain')
        .postTransactions(transactionPool.guard.accept)
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
      logger.info(`${requestIp.getClientIp(request)} downloading 400 blocks from height ${request.query.lastBlockHeight}`)
      const blocks = await container.resolvePlugin('database').getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)

      return { success: true, blocks: blocks }
    } catch (error) {
      logger.error(error.stack)
      return h.response({ success: false, error: error }).code(500)
    }
  }
}
