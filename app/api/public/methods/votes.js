const db = require('app/core/dbinterface').getInstance()
const { TRANSACTION_TYPES } = require('app/core/constants')

exports.register = async (server) => {
  server.method('getVotes', async (data) => {
    return db.transactions.findAllByType(TRANSACTION_TYPES.VOTE, data)
  })

  server.method('getVote', async (data) => {
    return db.transactions.findByTypeAndId(TRANSACTION_TYPES.VOTE, data)
  })
}
