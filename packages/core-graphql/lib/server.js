'use strict';

const Hapi = require('hapi')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const server = require('./schema')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const app = new Hapi.Server({
    host: config.host,
    port: config.port
  })

  /**
   * Register useful hapi.js plugins, the same are also found
   * in @arkecosystem/core-api.
   */
  await app.register([require('vision'), require('inert'), require('lout')])

  /**
   * Register Apollo GraphQL plugin for hapi.js server with
   * our own parameters.
   * The bulk of the Ark logic for GraphQL is rooted in the
   * schema module.
   */
  await server.applyMiddleware({
    app,
    path: config.path
  })

  await server.installSubscriptionHandlers(app.listener)

  /**
   * Start the hapi.js server and return it, exit process if
   * errors are caught.
   * The returned hapi.js instance is accessible through:
   * (@arkecosystem/core-container).resolvePlugin('graphql')
   */
  try {
    await app.start()

    logger.info(`GraphQL API Server running at: ${app.info.uri}`)

    return app
  } catch (error) {
    logger.error(error.stack)
    // TODO no exit here?
    process.exit(1)
  }
}
