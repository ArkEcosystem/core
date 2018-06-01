'use strict'

const webhookManager = require('./manager')
const database = require('./database')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks',
  async register (container, options) {
    const logger = container.resolvePlugin('logger')

    if (!options.enabled) {
      logger.info('Webhooks are disabled...')

      return
    }

    logger.info('Starting Webhooks...')

    await database.setUp(options.database)

    await webhookManager.setUp(options)

    if (options.server.enabled) {
      return require('./server')(options.server)
    } else {
      logger.info('Webhooks API is disabled...')
    }
  },
  async deregister (container, options) {
    if (options.server.enabled) {
      container.resolvePlugin('logger').info('Stopping Webhook API...')

      return container.resolvePlugin('webhooks').stop()
    }
  }
}

/**
 * The database connection.
 * @type {Database}
 */
exports.database = database
