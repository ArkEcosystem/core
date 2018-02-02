'use strict'

const goofy = require('../../core/goofy')
const Glue = require('glue')

module.exports = (config) => {
  if (!config.server.api.mount) {
    return goofy.info('Oh snap! Public API not mounted...')
  }

  const manifest = {
    server: {
      port: config.server.api.port
    },
    register: {
      plugins: [
        {
          plugin: require('hapi-api-version'),
          options: {
            validVersions: [1, 2],
            defaultVersion: config.server.api.version,
            vendorName: 'arkpublic',
            basePath: '/api/'
          }
        },
        {
          plugin: './plugins/caster'
        },
        {
          plugin: './plugins/validation'
        },
        {
          plugin: require('hapi-rate-limit'),
          options: {
            enabled: config.server.api.ratelimit.enabled,
            pathLimit: false,
            userLimit: config.server.api.ratelimit.limit,
            userCache: {
              expiresIn: config.server.api.ratelimit.expires
            }
          }
        },
        {
          plugin: require('hapi-pagination'),
          options: {
            results: {
              name: 'data'
            },
            routes: {
              include: [
                '/api/v2/blocks',
                '/api/v2/blocks/{id}/transactions',
                '/api/v2/blocks/search',
                '/api/v2/delegates',
                '/api/v2/delegates/{id}/blocks',
                '/api/v2/delegates/{id}/voters',
                '/api/v2/multisignatures',
                '/api/v2/peers',
                '/api/v2/signatures',
                '/api/v2/transactions',
                '/api/v2/transactions/search',
                '/api/v2/votes',
                '/api/v2/wallets',
                '/api/v2/wallets/{id}/transactions',
                '/api/v2/wallets/{id}/transactions/received',
                '/api/v2/wallets/{id}/transactions/send',
                '/api/v2/wallets/{id}/votes',
                '/api/v2/wallets/search'
              ],
              exclude: ['*']
            }
          }
        },
        {
          plugin: require('./versions/1'),
          routes: {
            prefix: '/api/v1'
          }
        },
        {
          plugin: require('./versions/2'),
          routes: {
            prefix: '/api/v2'
          }
        }
      ]
    }
  }

  if (config.server.api.cache) {
    manifest.server.cache = [{
      name: 'redisCache',
      engine: require('catbox-redis'),
      host: '127.0.0.1',
      partition: 'cache'
    }]
  }

  const options = {
    relativeTo: __dirname
  }

  const startServer = async function () {
    try {
      const server = await Glue.compose(manifest, options)
      await server.start()
      goofy.info(`Oh hapi day! Public API is listening on ${server.info.uri}`)
    } catch (err) {
      goofy.error(err)

      process.exit(1)
    }
  }

  startServer()
}
