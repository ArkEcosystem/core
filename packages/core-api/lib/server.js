'use strict'

const Hapi = require('hapi')
const HapiSwagger = require('hapi-swagger')

const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */

let corsHeaders = {
  origin: ['*'],
  headers: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type', 'CORELATION_ID'],
  credentials: true
}

module.exports = async (config) => {
  const baseConfig = {
    host: config.host,
    port: config.port,
    routes: {
      cors: corsHeaders,
      validate: {
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  }

  if (config.cache.enabled) {
    const cacheOptions = config.cache.options
    cacheOptions.engine = require(cacheOptions.engine)
    baseConfig.cache = [cacheOptions]
    baseConfig.routes.cache = { expiresIn: cacheOptions.expiresIn }
  }

  const server = new Hapi.Server(baseConfig)

  await server.register([require('vision'), require('inert'), require('lout')])

  await server.register({
    plugin: require('./plugins/whitelist'),
    options: {
      whitelist: config.whitelist
    }
  })

  await server.register({
    plugin: require('hapi-api-version'),
    options: {
      validVersions: config.versions.valid,
      defaultVersion: config.versions.default,
      basePath: '/api/',
      vendorName: 'ark-core-api'
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

  const swaggerOptions = {
    info: {
      title: 'Test API Documentation',
      version: '0.0.1'
    },
    grouping: 'tags',
    tags: [
      {
        name: 'blocks',
        description: 'Blocks endpoint'
      },
      {
        name: 'delegates',
        description: 'Delegates endpoint'
      },
      {
        name: 'accounts',
        description: 'Accounts endpoint'
      }, {
        name: 'transactions',
        description: 'Transactions endpoint'
      },
      {
        name: 'peers',
        description: 'Peers endpoint'
      },
      {
        name: 'loader',
        description: 'Loader endpoint'
      },
      {
        name: 'signatures',
        description: 'Signatures endpoint'
      }]
  }
  await server.register({
    plugin: HapiSwagger,
    options: swaggerOptions
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

  try {
    await server.start()

    logger.info(`Public API Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.stack)

    process.exit(1)
  }
}
