const Hapi = require('hapi')
const logger = require('@arkecosystem/core-pluggy').get('logger')

module.exports = async (config) => {
  if (!config.enabled) {
    return logger.info('Oh snap! Webhook API not enabled...')
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

    logger.info(`Oh hapi day! Webhook API is listening on ${server.info.uri}`)
  } catch (error) {
    logger.error(error.stack)

    process.exit(1)
  }
}
