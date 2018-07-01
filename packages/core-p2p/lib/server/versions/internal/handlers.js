'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const requestIp = require('request-ip')

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

      // console.log(delegates.length)
      // console.log(~~(timestamp / blockTime) % maxActive)
      // console.log(delegates[~~(timestamp / blockTime) % maxActive])

      return {
        success: true,
        round: {
          current: parseInt(height / maxActive),
          reward: reward,
          timestamp: timestamp,
          delegates: delegates,
          delegate: delegates[parseInt(timestamp / blockTime) % maxActive],
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
exports.getQuorum = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain) {
      return { success: false, isAllowed: false }
    }
    try {
      return {
        success: true,
        quorum: await blockchain.p2p.getQuorum()
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}
