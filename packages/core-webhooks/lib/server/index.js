'use strict'

const { createServer, mountServer, plugins } = require('@arkecosystem/core-http-utils')

/**
 * Creates a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
    routes: {
      cors: true,
      validate: {
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  })

  await server.register({
    plugin: plugins.whitelist,
    options: {
      whitelist: config.whitelist,
      name: 'Webhook API'
    }
  })

  await server.register({
    plugin: require('hapi-pagination'),
    options: {
      meta: {
        baseUri: ''
      },
      query: {
        limit: {
          default: config.pagination.limit
        }
      },
      results: {
        name: 'data'
      },
      routes: {
        include: config.pagination.include,
        exclude: ['*']
      }
    }
  })

  await server.register({
    plugin: require('./routes'),
    routes: { prefix: '/api' },
    options: config
  })

  return mountServer('Webhook API', server)
}
