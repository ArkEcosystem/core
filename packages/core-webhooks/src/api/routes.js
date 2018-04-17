const register = async (server, options) => {
  require('./schema').init(options)

  const handler = require('./handler')

  server.app.events = options.events

  server.route([{
    method: 'GET',
    path: '/webhooks',
    ...handler.index
  }, {
    method: 'POST',
    path: '/webhooks',
    ...handler.store
  }, {
    method: 'GET',
    path: '/webhooks/{id}',
    ...handler.show
  }, {
    method: 'PUT',
    path: '/webhooks/{id}',
    ...handler.update
  }, {
    method: 'DELETE',
    path: '/webhooks/{id}',
    ...handler.destroy
  }, {
    method: 'GET',
    path: '/webhooks/events',
    ...handler.events
  }])
}

exports.plugin = {
  name: 'ARK Webhooks API',
  version: '1.0.0',
  register
}
