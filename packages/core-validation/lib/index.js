'use strict'

const validator = require('./validator')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'validator',
  register: async (container, options) => validator
}
