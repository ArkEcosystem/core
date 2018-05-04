'use strict'

const container = require('@arkecosystem/core-container')
const blockchain = container.get('blockchain')
const config = container.get('config')

const client = require('@arkecosystem/client')
const { slots } = client
const { Transaction } = client.models

/**
 * @type {Object}
 */
exports.postVerifyTransaction = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await blockchain.database.verifyTransaction(transaction)

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
    // console.log(request.payload)
    blockchain.queueBlock(request.payload)

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
  handler: async (request, h) => {
    const lastBlock = blockchain.getLastBlock()

    try {
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
      return h.response({ success: false, message: error.message }).code(500).takeover()
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
  handler: async (request, h) => {
    const height = blockchain.getLastBlock(true).height
    const blockSize = config.getConstants(height).block.maxTransactions

    try {
      return {
        success: true,
        data: await blockchain.getUnconfirmedTransactions(blockSize, true)
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}
