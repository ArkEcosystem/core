const fs = require('fs-extra')
const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')
const snapshotManager = app.resolvePlugin('snapshots')

const utils = require('../utils')

module.exports = async options => {
  if (options.filename && !fs.existsSync(utils.getPath(options.filename))) {
    logger.error(
      `Appending not possible. Existing snapshot ${
        options.filename
      } not found. Exiting...`,
    )
    throw new Error(
      `Appending not possible. Existing snapshot ${
        options.filename
      } not found. Exiting...`,
    )
  } else {
    await snapshotManager.exportData(options)
  }
}
