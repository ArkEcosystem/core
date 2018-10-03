'use strict'

const SnapshotManager = require('../manager')

module.exports = async (options) => {
  await new SnapshotManager().importData(options)
}
