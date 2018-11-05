'use strict'

const SnapshotManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'snapshots',
  async register (container, options) {
    const manager = new SnapshotManager(options)

    return manager.make(container.resolvePlugin('database'))
  }
}
