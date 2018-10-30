'use strict'
const container = require('@arkecosystem/core-container')
const snapshotManager = container.resolvePlugin('snapshots')
const emitter = container.resolvePlugin('event-emitter')
const logger = container.resolvePlugin('logger')

module.exports = async (options) => {
  await snapshotManager.importData(options)

  emitter.on('import:complete', results => {
    logger.info(`Import of ${results} done`)
  })
}
