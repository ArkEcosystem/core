'use strict'
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const snapshotManager = container.resolvePlugin('snapshots')

module.exports = async (options) => {
  if (options.filename && !fs.existsSync(`${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${options.filename}`)) {
    logger.error(`Verify not possible. Snapshot ${options.filename} not found.`)
    logger.info('Use -f parameter with just the filename and not the full path.')
  } else {
    await snapshotManager.verifyData(options)
  }
}
