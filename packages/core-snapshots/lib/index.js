'use strict'

const SnapshotManager = require('./manager')
/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'snapshots',
  async register (container, options) {
    const logger = container.resolvePlugin('logger')
    logger.info('Starting Snapshot Manager with already established core-database-postgres connection.')
    return new SnapshotManager(container.resolvePlugin('database'))
  }
}
