'use strict';

const { slots } = require('@arkecosystem/client')
const blockchain = require('@arkecosystem/core-plugin-manager').get('blockchain')
const config = require('@arkecosystem/core-plugin-manager').get('config')
const { Transaction } = require('@arkecosystem/client').models

/**
 * [postVerifyTransaction description]
 * @type {Object}
 */
exports.postVerifyTransaction = {
  handler: async (request, h) => {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await blockchain.getInstance().getDatabaseConnection().verifyTransaction(transaction)

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
    blockchain.getInstance().postBlock(request.payload)

    return { success: true }
  }
}

/**
 * [getRound description]
 * @type {Object}
 */
exports.getRound = {
  handler: async (request, h) => {
    const lastBlock = blockchain.getInstance().getState().lastBlock
    try {
      const height = lastBlock.data.height + 1
      const maxActive = config.getConstants(height).activeDelegates
      const blockTime = config.getConstants(height).blocktime
      const reward = config.getConstants(height).reward
      const delegates = await blockchain.getInstance().getDatabaseConnection().getActiveDelegates(height)
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
    const height = blockchain.getInstance().getState().lastBlock.data.height
    const blockSize = config.getConstants(height).block.maxTransactions
    try {
      return {
        success: true,
        data: await blockchain.getInstance().getUnconfirmedTransactions(blockSize, true)
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}
