/* eslint no-await-in-loop: "off" */

const {
  createServer,
  createSecureServer,
  mountServer,
  plugins,
} = require('@arkecosystem/core-http-utils')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async config => {
  const options = {
    host: config.host,
    port: config.port,
    routes: {
      cors: {
        additionalHeaders: ['api-version'],
      },
      validate: {
        async failAction(request, h, err) {
          throw err
        },
      },
    },
  }

  const servers = { http: await createServer(options) }

  if (config.ssl.enabled) {
    servers.https = await createSecureServer(options, null, config.ssl)
  }

  for (const [type, server] of Object.entries(servers)) {
    // TODO: enable after mainnet migration
    // await server.register({ plugin: plugins.contentType })

    await server.register({
      plugin: plugins.corsHeaders,
    })

    await server.register({
      plugin: plugins.transactionPayload,
      options: {
        routes: [
          {
            method: 'POST',
            path: '/api/v2/transactions',
          },
        ],
      },
    })

    await server.register({
      plugin: plugins.whitelist,
      options: {
        whitelist: config.whitelist,
        name: 'Public API',
      },
    })

    await server.register({
      plugin: require('./plugins/set-headers'),
    })

    await server.register({
      plugin: require('hapi-api-version'),
      options: config.versions,
    })

    await server.register({
      plugin: require('./plugins/endpoint-version'),
      options: { validVersions: config.versions.validVersions },
    })

    await server.register({
      plugin: require('./plugins/caster'),
    })

    await server.register({
      plugin: require('./plugins/validation'),
    })

    await server.register({
      plugin: require('hapi-rate-limit'),
      options: config.rateLimit,
    })

    await server.register({
      plugin: require('hapi-pagination'),
      options: {
        meta: {
          baseUri: '',
        },
        query: {
          limit: {
            default: config.pagination.limit,
          },
        },
        results: {
          name: 'data',
        },
        routes: {
          include: config.pagination.include,
          exclude: ['*'],
        },
      },
    })

    for (const plugin of config.plugins) {
      if (typeof plugin.plugin === 'string') {
        plugin.plugin = require(plugin.plugin)
      }

      await server.register(plugin)
    }

    await mountServer(`Public ${type} API`, server)
  }

  return servers
}
