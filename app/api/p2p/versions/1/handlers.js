const arkjs = require('arkjs')
const logger = require('../../../../core/logger')
const blockchain = require('../../../../core/managers/blockchain')
const Transaction = require('../../../../models/transaction')

exports.getPeers = {
  handler: async (request, h) => {
    try {
      const peers = await request.server.app.p2p.getPeers()

      const rpeers = peers
        .map(peer => peer.toBroadcastInfo())
        .sort(() => Math.random() - 0.5)

      return {success: true, peers: rpeers}
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

exports.getHeight = {
  handler: (request, h) => {
    return {
      success: true,
      height: blockchain.getInstance().getState().lastBlock.data.height,
      id: blockchain.getInstance().getState().lastBlock.data.id
    }
  }
}

exports.getCommonBlock = {
  handler: async (request, h) => {
    const ids = request.query.ids.split(',').slice(0, 9).filter(id => id.match(/^\d+$/))

    try {
      const commonBlock = await blockchain.getInstance().getDb().getCommonBlock(ids)

      return {
        success: true,
        common: commonBlock.length ? commonBlock[0] : null,
        lastBlockHeight: blockchain.getInstance().getState().lastBlock.data.height
      }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

exports.getTransactionsFromIds = {
  handler: async (request, h) => {
    const txids = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))

    try {
      const transactions = await blockchain.getInstance().getDb().getTransactionsFromIds(txids)

      return { success: true, transactions: transactions }
    } catch (error) {
      return h.response({ success: false, message: error.message }).code(500).takeover()
    }
  }
}

exports.getTransactions = {
  handler: (request, h) => {
    return { success: true, transactions: [] }
  }
}

exports.getStatus = {
  handler: (request, h) => {
    const lastBlock = blockchain.getInstance().getState().lastBlock
    if (!lastBlock) {
      return {
        success: false
      }
    } else {
      return {
        success: true,
        height: lastBlock.height,
        forgingAllowed: arkjs.slots.getSlotNumber() === arkjs.slots.getSlotNumber(arkjs.slots.getTime() + arkjs.slots.interval / 2),
        currentSlot: arkjs.slots.getSlotNumber(),
        header: lastBlock.getHeader()
      }
    }
  }
}

exports.postBlock = {
  handler: (request, h) => {
    if (!request.payload.block) return { success: false }

    blockchain.getInstance().postBlock(request.payload.block)
    return { success: true }
  }
}

exports.postTransactions = {
  handler: async (request, h) => {
    const transactions = request.payload.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction).toString('hex')))

    blockchain.getInstance().postTransactions(transactions)

    return { success: true, transactionIds: [] }
  }
}

exports.getBlocks = {
  handler: async (request, h) => {
    try {
      const blocks = await blockchain.getInstance().getDb().getBlocks(parseInt(request.query.lastBlockHeight) + 1, 400)

      return { success: true, blocks: blocks }
    } catch (error) {
      logger.error(error.stack)
      return h.response({ success: false, error: error }).code(500)
    }
  }
}
