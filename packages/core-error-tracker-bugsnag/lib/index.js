'use strict'

const bugsnag = require('bugsnag')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'error-tracker',
  async register (container, options) {
    bugsnag.register(options.apiKey, options.configuration)

    return bugsnag
  }
}
