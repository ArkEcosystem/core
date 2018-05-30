'use strict'

const Hapi = require('hapi')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

/**
 * Creates a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  if (!config.enabled) {
    return logger.info('Webhook API is not enabled')
  }

  const baseConfig = {
    port: config.port,
    routes: {
      auth: 'webhooks',
      cors: true,
      validate: {
        async failAction (request, h, err) {
           throw err
        }
      }
    }
  }

  const server = new Hapi.Server(baseConfig)
  await server.register({
    plugin: require('./plugins/whitelist'),
    options: {
      whitelist: config.whitelist
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

  try {
    await server.start()

    logger.info(`Webhook API available and listening on ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.stack)
    // TODO no exit here?
    process.exit(1)
  }
}
