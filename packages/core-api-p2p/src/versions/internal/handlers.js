'use strict';

const { slots } = require('@arkecosystem/client')
const pluginManager = require('@arkecosystem/core-plugin-manager')
const blockchainManager = pluginManager.get('blockchain')
const config = pluginManager.get('config')
const { Transaction } = require('@arkecosystem/client').models

/**
 * [postVerifyTransaction description]
 * @type {Object}
 */
exports.postVerifyTransaction = {
  handler: async (request, h) => {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await blockchainManager.getDatabaseConnection().verifyTransaction(transaction)

    return { success: result }
  }
}

/**
 * [postInternalBlock description]
 * @type {Object}
 */
exports.postInternalBlock = {
  handler: (request, h) => {
    // console.log(request.payload)
    blockchainManager.postBlock(request.payload)

    return { success: true }
  }
}

/**
 * [getRound description]
 * @type {Object}
 */
exports.getRound = {
  handler: async (request, h) => {
    const lastBlock = blockchainManager.getState().lastBlock
    try {
      const height = lastBlock.data.height + 1
      const maxActive = config.getConstants(height).activeDelegates
      const blockTime = config.getConstants(height).blocktime
      const reward = config.getConstants(height).reward
      const delegates = await blockchainManager.getDatabaseConnection().getActiveDelegates(height)
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
 * [getTransactionsForForging description]
 * @type {Object}
 */
exports.getTransactionsForForging = {
  handler: async (request, h) => {
    const height = blockchainManager.getState().lastBlock.data.height
    const blockSize = config.getConstants(height).block.maxTransactions
    try {
      return {
        success: true,
        data: await blockchainManager.getUnconfirmedTransactions(blockSize, true)
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}
