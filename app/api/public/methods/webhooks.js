const db = require('app/core/dbinterface').getInstance()

exports.register = async (server) => {
  server.method('paginateWebhooks', async (data) => {
    return db.webhooks.paginate(data)
  })

  server.method('showWebhook', async (data) => {
    return db.webhooks.findById(data)
  })
}
