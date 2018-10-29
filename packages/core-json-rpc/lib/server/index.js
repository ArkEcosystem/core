'use strict'

const { createServer, mountServer, plugins } = require('@arkecosystem/core-http-utils')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

function registerMethods (server, group) {
  Object.values(require(`./methods/${group}`)).forEach(method => {
    server.app.schemas[method.name] = method.schema

    delete method.schema

    server.method(method)
  })
}

/**
 * Create a new hapi.js server.
 * @param  {Object} options
 * @return {Hapi.Server}
 */
module.exports = async (options) => {
  if (options.allowRemote) {
    logger.warn('JSON-RPC server allows remote connections, this is a potential security risk :warning:')
  }

  const server = await createServer({
    host: options.host,
    port: options.port
  })

  server.app.schemas = {}

  if (!options.allowRemote) {
    await server.register({
      plugin: plugins.whitelist,
      options: {
        whitelist: options.whitelist,
        name: 'JSON-RPC'
      }
    })
  }

  registerMethods(server, 'wallets')
  registerMethods(server, 'blocks')
  registerMethods(server, 'transactions')

  server.route(require('./handler'))

  return mountServer('JSON-RPC', server)
}
