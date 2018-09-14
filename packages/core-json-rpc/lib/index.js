'use strict'

const database = require('./server/services/database')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'json-rpc',
  async register (container, options) {
    const logger = container.resolvePlugin('logger')

    if (!options.enabled) {
      logger.info('JSON-RPC Server is disabled :grey_exclamation:')

      return
    }

    database.init(options.database)

    return require('./server')(options)
  },
  async deregister (container, options) {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Stopping JSON-RPC Server')

      return container.resolvePlugin('json-rpc').stop()
    }
  }
}
