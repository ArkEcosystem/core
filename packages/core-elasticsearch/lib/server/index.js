'use strict'

const { createServer, mountServer, plugins } = require('@arkecosystem/core-http-utils')

/**
 * Creates a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
    routes: {
      validate: {
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  })

  await server.register({
    plugin: plugins.whitelist,
    options: {
      whitelist: config.whitelist,
      name: 'Elasticsearch API'
    }
  })

  await server.register(require('./routes'))

  return mountServer('Elasticsearch API', server)
}
