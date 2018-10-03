'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const SnapshotManager = require('../manager')

module.exports = async (options) => {
  if (!options.height) {
    logger.warn('Rollback height is not specified')
    process.exit(0)
  }
  logger.info(`Starting the process of rolling back chain to block height of ${options.height}`)

  await new SnapshotManager().rollbackChain(options)
}
