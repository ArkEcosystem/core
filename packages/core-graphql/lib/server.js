'use strict';

const Hapi = require('hapi')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const { graphqlHapi, graphiqlHapi } = require('apollo-server-hapi')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = new Hapi.Server({
    host: config.host,
    port: config.port
  })

  /**
   * Register useful hapi.js plugins, the same are also found
   * in @arkecosystem/core-api.
   */
  await server.register([require('vision'), require('inert'), require('lout')])

  /**
   * Register Apollo GraphQL plugin for hapi.js server with
   * our own parameters.
   * The bulk of the Ark logic for GraphQL is rooted in the
   * schema module.
   */
  await server.register({
    plugin: graphqlHapi,
    options: {
      path: config.path,
      graphqlOptions: require('./schema'),
      route: {
        cors: true
      }
    }
  })

  /**
   * Optionally register the GraphiQL Apollo hapi.js plugin
   */
  if (config.graphiql) {
    await server.register({
      plugin: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: {
          endpointURL: config.path
        }
      }
    })
  }

  /**
   * Start the hapi.js server and return it, exit process if
   * errors are caught.
   * The returned hapi.js instance is accessible through:
   * (@arkecosystem/core-container).resolvePlugin('graphql')
   */
  try {
    await server.start()

    logger.info(`GraphQL API Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.stack)
    // TODO no exit here?
    process.exit(1)
  }
}
