const db = require('app/core/dbinterface').getInstance()

exports.register = async (server) => {
  server.method('getBlocks', async (data) => {
    return db.blocks.findAll(data)
  })

  server.method('getBlock', async (id) => {
    return db.blocks.findById(id)
  })

  server.method('getBlockTransactions', async (id, paginate) => {
    const block = await db.blocks.findById(id)

    return db.transactions.findAllByBlock(block.id, paginate)
  })

  server.method('searchBlocks', async (data) => {
    return db.blocks.search(data)
  })
}
