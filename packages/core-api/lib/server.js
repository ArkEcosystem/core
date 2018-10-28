'use strict'

const { createServer, mountServer, plugins } = require('@arkecosystem/core-http-utils')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
    routes: {
      cors: {
        additionalHeaders: ['api-version']
      },
      validate: {
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  })

  await server.register({
    plugin: plugins.whitelist,
    options: { whitelist: config.whitelist }
  })

  await server.register({
    plugin: require('./plugins/set-headers')
  })

  await server.register({
    plugin: require('hapi-api-version'),
    options: {
      validVersions: config.versions.valid,
      defaultVersion: config.versions.default,
      basePath: '/api/',
      vendorName: 'ark.core-api'
    }
  })

  await server.register({
    plugin: require('./plugins/endpoint-version'),
    options: {
      validVersions: config.versions.valid
    }
  })

  await server.register({ plugin: require('./plugins/caster') })

  await server.register({ plugin: require('./plugins/validation') })

  await server.register({
    plugin: require('hapi-rate-limit'),
    options: {
      enabled: config.rateLimit.enabled,
      pathLimit: false,
      userLimit: config.rateLimit.limit,
      userCache: {
        expiresIn: config.rateLimit.expires
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
    plugin: require('./versions/1'),
    routes: { prefix: '/api/v1' }
  })

  await server.register({
    plugin: require('./versions/2'),
    routes: { prefix: '/api/v2' },
    options: config
  })

  return mountServer('Public API', server)
}
