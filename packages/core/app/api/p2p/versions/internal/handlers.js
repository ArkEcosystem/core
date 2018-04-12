const { slots } = require('@arkecosystem/client')
const blockchain = require('../../../../core/managers/blockchain')
const config = require('../../../../core/config')
const { Transaction } = require('@arkecosystem/client').models

exports.postVerifyTransaction = {
  handler: async (request, h) => {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await blockchain.getInstance().getDb().verifyTransaction(transaction)

    return { success: result }
  }
}

exports.postInternalBlock = {
  handler: (request, h) => {
    // console.log(request.payload)
    blockchain.getInstance().postBlock(request.payload)

    return { success: true }
  }
}

exports.getRound = {
  handler: async (request, h) => {
    const lastBlock = blockchain.getInstance().getState().lastBlock
    try {
      const height = lastBlock.data.height + 1
      const maxActive = config.getConstants(height).activeDelegates
      const blockTime = config.getConstants(height).blocktime
      const reward = config.getConstants(height).reward
      const delegates = await blockchain.getInstance().getDb().getActiveDelegates(height)
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
