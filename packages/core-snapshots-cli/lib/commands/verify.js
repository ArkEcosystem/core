'use strict'
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

const SnapshotManager = container.resolvePlugin('snapshot-manager')
const utils = require('../utils')

module.exports = async (options) => {
  if (options.filename && !fs.existsSync(utils.getPath(options.filename))) {
    logger.error(`Verify not possible. Snapshot ${options.filename} not found.`)
    logger.info('Use -f parameter with just the filename and not the full path.')
    process.exit(1)
  }

  await SnapshotManager.verifyData(options)
}
