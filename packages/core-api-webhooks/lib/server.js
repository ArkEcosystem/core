'use strict'

const Hapi = require('hapi')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

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
        failAction: async (request, h, err) => { throw err }
      }
    }
  }

  const server = new Hapi.Server(baseConfig)
  await server.register(require('./plugins/auth'))
  await server.auth.strategy('webhooks', 'webhooks', { token: config.token })

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

    process.exit(1)
  }
}
