const db = require('app/core/dbinterface').getInstance()
const { TRANSACTION_TYPES } = require('app/core/constants')

exports.register = async (server) => {
  server.method('getTransactionsStatistics', async (from, to) => {
    return db.transactions.findAllByDateAndType(TRANSACTION_TYPES.TRANSFER, from, to)
  })

  server.method('getBlockStatistics', async (from, to) => {
    return db.blocks.findAllByDateTimeRange(from, to)
  })

  server.method('getVoteStatistics', async (from, to) => {
    const transactions = await db.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, from, to)

    return transactions.filter(v => v.asset.votes[0].startsWith('+'))
  })

  server.method('getUnvoteStatistics', async (from, to) => {
    const transactions = await db.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, from, to)

    return transactions.filter(v => v.asset.votes[0].startsWith('-'))
  })
}
