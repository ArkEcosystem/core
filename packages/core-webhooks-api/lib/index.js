'use strict'

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks-api',
  async register (container, options) {
    if (!options.enabled) {
      container.resolvePlugin('logger').info('Webhooks API is disabled...')

      return
    }

    container.resolvePlugin('logger').info('Starting Webhook API...')

    return require('./server')(options)
  },
  async deregister (container, options) {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Stopping Webhook API...')

      return container.resolvePlugin('webhooks-api').stop()
    }
  }
}
