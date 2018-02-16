const arkjs = require('arkjs')
const blockchain = require('app/core/managers/blockchain')
const Transaction = require('app/models/transaction')

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
    const maxActive = this.config.getConstants(lastBlock.data.height).activeDelegates
    const blockTime = this.config.getConstants(lastBlock.data.height).blocktime
    const reward = this.config.getConstants(lastBlock.data.height).reward

    try {
      const delegates = await this.getActiveDelegates(lastBlock.data.height)

      return {
        success: true,
        round: {
          current: parseInt(lastBlock.data.height / maxActive),
          reward: reward,
          timestamp: arkjs.slots.getTime(),
          delegates: delegates,
          delegate: delegates[lastBlock.data.height % maxActive],
          lastBlock: lastBlock.data,
          canForge: parseInt(lastBlock.data.timestamp / blockTime) < parseInt(arkjs.slots.getTime() / blockTime)
        }
      }
    } catch (error) {
      return h.response({ success: false, message: error }).code(500)
    }
  }
}
