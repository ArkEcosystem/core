'use strict'

const Sentry = require('@sentry/node')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'error-tracker',
  async register (container, options) {
    Sentry.init(options)

    return Sentry
  }
}
