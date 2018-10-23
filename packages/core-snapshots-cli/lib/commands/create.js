'use strict'
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

const utils = require('../utils')

module.exports = async (options) => {
  if (options.filename && !fs.existsSync(utils.getPath(options.filename))) {
    logger.error(`Appending not possible. Existing snapshot ${options.filename} not found. Exiting...`)
    process.exit(1)
  }

  const snapshotManager = container.resolvePlugin('snapshots')
  console.log(snapshotManager)
  // const snapshotManager = container.resolvePlugin('snapshots')
  console.log(snapshotManager)
  await snapshotManager.exportData(options)

  await utils.tearDown()
}
