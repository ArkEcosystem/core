'use strict'

const SnapshotManager = require('../manager')

module.exports = async (options) => {
  await SnapshotManager.importData(options)
}
