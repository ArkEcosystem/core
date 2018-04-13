const logger = require('@arkecosystem/core-logger')
const Hapi = require('hapi')

module.exports = async (config) => {
  if (!config.api.public.enabled) {
    return logger.info('Oh snap! Public API not enabled...')
  }

  const baseConfig = {
    port: config.api.public.port,
    routes: {
      cors: true,
      validate: {
        failAction: async (request, h, err) => { throw err }
      }
    }
  }

  if (config.api.public.cache.enabled) {
    const cacheOptions = config.api.public.cache.options
    cacheOptions.engine = require(cacheOptions.engine)
    baseConfig.cache = [cacheOptions]
    baseConfig.routes.cache = { expiresIn: cacheOptions.expiresIn }
  }

  const server = new Hapi.Server(baseConfig)

  await server.register([require('vision'), require('inert'), require('lout')])

  await server.register(require('./plugins/auth/webhooks'))

  await server.auth.strategy('webhooks', 'webhooks', {
    token: config.webhooks.token
  })

  await server.register({
    plugin: require('hapi-api-version'),
    options: {
      validVersions: config.api.public.versions.valid,
      defaultVersion: config.api.public.versions.default,
      basePath: '/api/',
      vendorName: 'ark-core-public-api'
    }
  })

  await server.register({ plugin: require('./plugins/caster') })

  await server.register({ plugin: require('./plugins/validation') })

  await server.register({
    plugin: require('hapi-rate-limit'),
    options: {
      enabled: config.api.public.rateLimit.enabled,
      pathLimit: false,
      userLimit: config.api.public.rateLimit.limit,
      userCache: {
        expiresIn: config.api.public.rateLimit.expires
      }
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
          default: config.api.public.pagination.limit
        }
      },
      results: {
        name: 'data'
      },
      routes: {
        include: config.api.public.pagination.include,
        exclude: ['*']
      }
    }
  })

  await server.register({
    plugin: require('./versions/1'),
    routes: { prefix: '/api/v1' }
  })

  await server.register({
    plugin: require('./versions/2'),
    routes: { prefix: '/api/v2' }
  })

  try {
    await server.start()

    logger.info(`Oh hapi day! Public API is listening on ${server.info.uri}`)
  } catch (error) {
    logger.error(error.stack)

    process.exit(1)
  }
}
