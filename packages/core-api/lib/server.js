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

  await server.register({ plugin: plugins.corsHeaders })

  await server.register({
    plugin: plugins.whitelist,
    options: {
      whitelist: config.whitelist,
      name: 'Public API'
    }
  })

  await server.register({
    plugin: require('./plugins/set-headers')
  })

  await server.register({
    plugin: require('hapi-api-version'),
    options: config.versions
  })

  await server.register({
    plugin: require('./plugins/endpoint-version'),
    options: { validVersions: config.versions.validVersions }
  })

  await server.register({ plugin: require('./plugins/caster') })

  await server.register({ plugin: require('./plugins/validation') })

  await server.register({
    plugin: require('hapi-rate-limit'),
    options: config.rateLimit
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

  for (const plugin of config.plugins) {
    if (typeof plugin.plugin === 'string') {
      plugin.plugin = require(plugin.plugin)
    }

    await server.register(plugin)
  }

  return mountServer('Public API', server)
}
