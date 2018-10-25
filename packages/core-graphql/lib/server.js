'use strict';

const { createServer, mountServer, plugins } = require('@arkecosystem/core-http-utils')

const apolloServer = require('./schema')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port
  })

  await server.register({
    plugin: plugins.whitelist,
    options: { whitelist: config.whitelist }
  })

  await apolloServer.applyMiddleware({
    server,
    path: config.path
  })

  await apolloServer.installSubscriptionHandlers(server.listener)

  return mountServer('GraphQL', server)
}
