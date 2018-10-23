'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const snapshotManager = container.resolvePlugin('snapshots')

module.exports = async (options) => {
  if (options.blockHeight === -1) {
    logger.warn('Rollback height is not specified. Rolling back to last completed round.')
  }
  logger.info(`Starting the process of blockchain rollback to block height of ${options.blockHeight}`)

  await snapshotManager.rollbackChain(options.blockHeight)
}
