'use strict'

const goofy = require('app/core/goofy')
const Glue = require('glue')

module.exports = (config) => {
  if (!config.api.mount) {
    return goofy.info('Oh snap! Public API not mounted...')
  }

  const manifest = {
    server: {
      port: config.api.port
    },
    register: {
      plugins: [
        {
          plugin: require('hapi-api-version'),
          options: {
            validVersions: config.api.versions.valid,
            defaultVersion: config.api.versions.default,
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
            enabled: config.api.rateLimit.enabled,
            pathLimit: false,
            userLimit: config.api.rateLimit.limit,
            userCache: {
              expiresIn: config.api.rateLimit.expires
            }
          }
        },
        {
          plugin: require('hapi-pagination'),
          options: {
            query: {
              limit: {
                default: config.api.pagination.limit
              },
            },
            results: {
              name: 'data'
            },
            routes: {
              include: config.api.pagination.include,
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

  if (config.api.cache) {
    manifest.server.cache = [config.api.cache.options]
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
