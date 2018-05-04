'use strict'

const Blockchain = require('./blockchain')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async (container, options) => new Blockchain(container.get('config'), options.networkStart)
}
