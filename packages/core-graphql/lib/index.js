/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'graphql',
  async register(container, options) {
    if (!options.enabled) {
      container
        .resolvePlugin('logger')
        .info('GraphQL API is disabled :grey_exclamation:')

      return
    }

    return require('./server')(options)
  },
  async deregister(container, options) {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Stopping GraphQL API')

      return container.resolvePlugin('graphql').stop()
    }
  },
}
