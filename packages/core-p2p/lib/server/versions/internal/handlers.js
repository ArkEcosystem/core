'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const requestIp = require('request-ip')
const logger = container.resolvePlugin('logger')

const { slots } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

/**
 * @type {Object}
 */
exports.postVerifyTransaction = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await container.resolvePlugin('database').verifyTransaction(transaction)

    return { success: result }
  }
}

/**
 * @type {Object}
 */
exports.postInternalBlock = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    const block = request.payload
    block.ip = requestIp.getClientIp(request)
    container.resolvePlugin('blockchain').queueBlock(block)

    return { success: true }
  }
}

/**
 * @type {Object}
 */
exports.getRound = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    try {
      const blockchain = container.resolvePlugin('blockchain')

      const lastBlock = blockchain.getLastBlock()

      const height = lastBlock.data.height + 1
      const maxActive = config.getConstants(height).activeDelegates
      const blockTime = config.getConstants(height).blocktime
      const reward = config.getConstants(height).reward
      const delegates = await blockchain.database.getActiveDelegates(height)
      const timestamp = slots.getTime()

      return {
        success: true,
        round: {
          current: parseInt(height / maxActive),
          reward: reward,
          timestamp: timestamp,
          delegates: delegates,
          currentForger: delegates[parseInt(timestamp / blockTime) % maxActive],
          nextForger: delegates[(parseInt(timestamp / blockTime) + 1) % maxActive],
          lastBlock: lastBlock.data,
          canForge: parseInt(1 + lastBlock.data.timestamp / blockTime) * blockTime < timestamp - 1
        }
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getTransactionsForForging = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    const height = blockchain.getLastBlock().data.height
    const blockSize = config.getConstants(height).block.maxTransactions

    try {
      return {
        success: true,
        data: await blockchain.getUnconfirmedTransactions(blockSize, true)
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getNetworkState = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain) {
      return { success: true, error: 'Blockchain not ready' }
    }
    try {
      return {
        success: true,
        networkState: await blockchain.p2p.getNetworkState()
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.checkBlockchainSynced = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain) {
      return { success: true, error: 'Blockchain not ready' }
    }

    try {
      logger.debug('Blockchain sync check WAKEUP requested by forger :bed:')
      blockchain.dispatch('WAKEUP')

      return {
        success: true
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.getUsernames = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')
    const walletManager = container.resolvePlugin('database').walletManager

    const lastBlock = blockchain.getLastBlock()
    const delegates = await blockchain.database.getActiveDelegates(lastBlock.data.height + 1)

    const data = {}
    for (const delegate of delegates) {
      data[delegate.publicKey] = walletManager.getWalletByPublicKey(delegate.publicKey).username
    }

    return { success: true, data }
  }
}
