const arkjs = require('arkjs')
const crypto = require('crypto')
const blockchain = require('app/core/managers/blockchain')
const config = require('app/core/config')
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
    try {
      const maxActive = config.getConstants(lastBlock.data.height).activeDelegates
      const blockTime = config.getConstants(lastBlock.data.height).blocktime
      const reward = config.getConstants(lastBlock.data.height).reward
      const delegates = await __getActiveDelegates(lastBlock.data.height)

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
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

exports.getUnconfirmedTransactions = {
  handler: async (request, h) => {
    const height = blockchain.getInstance().getState().lastBlock.data.height
    const blockSize = config.getConstants(height).block.maxTransactions
    try {
      return {
        success: true,
        transactions: await blockchain.getInstance().getUnconfirmedTransactions(blockSize)
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

async function __getActiveDelegates (height) {
  const round = parseInt(height / config.getConstants(height).activeDelegates)
  const seedSource = round.toString()
  let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest()

  const activedelegates = await blockchain.getInstance().getDb().getActiveDelegates(height)

  for (let i = 0, delCount = activedelegates.length; i < delCount; i++) {
    for (let x = 0; x < 4 && i < delCount; i++, x++) {
      const newIndex = currentSeed[x] % delCount
      const b = activedelegates[newIndex]
      activedelegates[newIndex] = activedelegates[i]
      activedelegates[i] = b
    }
    currentSeed = crypto.createHash('sha256').update(currentSeed).digest()
  }

  return activedelegates
}
