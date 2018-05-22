'use strict'

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks-api',
  register: async (container, options) => {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Starting Webhook API...')

      return require('./server')(options)
    }
  },
  deregister: async (container, options) => {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Stopping Webhook API...')

      return container.resolvePlugin('webhooks-api').stop()
    }
  }
}
