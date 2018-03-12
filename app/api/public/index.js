const logger = require('app/core/logger')
const Hapi = require('hapi')

module.exports = async (config) => {
  if (!config.api.public.mount) {
    return logger.info('Oh snap! Public API not mounted...')
  }

  const baseConfig = {
    port: config.api.public.port,
    routes: {
      validate: {
        failAction: async (request, h, err) => { throw err }
      }
    }
  }

  if (config.api.public.cache.enabled) {
    const cacheOptions = config.api.public.cache.options
    cacheOptions.engine = require(cacheOptions.engine)
    baseConfig.cache = [cacheOptions]

    // Enable cache with expiration on all routes
    baseConfig.options = {
      routes: {
        cache: {
          expiresIn: cacheOptions.expiresIn
        }
      }
    }
  }

  const server = new Hapi.Server(baseConfig)

  await server.register(require('./plugins/auth/webhooks'))

  await server.auth.strategy('webhooks', 'webhooks', {
    secret: config.webhooks.secret
  })

  await server.register({
    plugin: require('hapi-api-version'),
    options: {
      validVersions: config.api.public.versions.valid,
      defaultVersion: config.api.public.versions.default,
      vendorName: 'arkpublic',
      basePath: '/api/'
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
