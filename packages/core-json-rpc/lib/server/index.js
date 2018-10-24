'use strict'

const Hapi = require('hapi')
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

  const server = new Hapi.Server({
    host: options.host,
    port: options.port
  })

  server.app.schemas = {}

  await server.register({ plugin: require('./plugins/whitelist'), options })

  registerMethods(server, 'wallets')
  registerMethods(server, 'blocks')
  registerMethods(server, 'transactions')

  server.route(require('./handler'))

  try {
    await server.start()

    logger.info(`JSON-RPC Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.message)
    // TODO no exit here?
    process.exit(1)
  }
}
