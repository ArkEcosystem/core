'use strict'

module.exports = {
  resetBlockchain: async () => {
    // Resets everything so that it can be used in beforeAll to start clean a test suite
    // Now resets: blocks (remove blocks other than genesis), transaction pool
    // TODO: reset rounds, transactions in db...
    const container = require('@arkecosystem/core-container')

    // reset to block height 1
    const blockchain = container.resolvePlugin('blockchain')
    const height = blockchain.getLastBlock().data.height
    if (height) {
        await blockchain.removeBlocks(height - 1)
    }

    const transactionPool = container.resolvePlugin('transactionPool')
    transactionPool.flush()
  }
}
