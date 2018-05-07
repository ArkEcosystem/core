'use strict';

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'api-graphql',
  register: async (manager, options) => {
    manager.get('logger').info('Starting GraphQL API...')

    return require('./server')(options)
  },
  deregister: async (manager) => {
    manager.get('logger').info('Stopping GraphQL API...')

    return manager.get('api-graphql').stop()
  }
}
