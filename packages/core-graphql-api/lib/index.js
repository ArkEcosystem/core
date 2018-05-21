'use strict';

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'api-graphql',
  register: async (container, options) => {
    container.resolvePlugin('logger').info('Starting GraphQL API...')

    return require('./server')(options)
  },
  deregister: async (container, options) => {
    container.resolvePlugin('logger').info('Stopping GraphQL API...')

    return container.resolvePlugin('api-graphql').stop()
  }
}
