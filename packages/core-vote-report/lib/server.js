'use strict'

const { createServer, mountServer } = require('@arkecosystem/core-http-utils')

module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: require('./handler')
  })

  return mountServer('Vote Report', server)
}
