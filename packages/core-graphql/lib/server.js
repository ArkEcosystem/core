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

  await server.register([require('vision'), require('inert'), require('lout')])

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
