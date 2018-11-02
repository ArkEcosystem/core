'use strict'

const Handlebars = require('handlebars')
const { createServer, mountServer } = require('@arkecosystem/core-http-utils')

module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port
  }, server => server.views({
    engines: { html: Handlebars },
    relativeTo: __dirname,
    path: 'templates'
  }))

  server.route({
    method: 'GET',
    path: '/',
    handler: require('./handler')
  })

  return mountServer('Vote Report', server)
}
