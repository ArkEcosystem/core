const db = require('app/core/dbinterface').getInstance()

exports.register = async (server) => {
  server.method('getTransactions', async (data) => {
    return db.transactions.findAll(data)
  })

  server.method('getTransaction', async (id) => {
    return db.transactions.findById(id)
  })

  server.method('searchTransactions', async (data) => {
    return db.transactions.search(data)
  })
}
