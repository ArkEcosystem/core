'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const SnapshotManager = require('../manager')

module.exports = async (options) => {
  if (options.height === -1) {
    logger.warn('Rollback height is not specified. Rolling back to last completed round.')
  }
  logger.info(`Starting the process of rolling back chain to block height of ${options.height}`)

  await new SnapshotManager().rollbackChain(options)
}
