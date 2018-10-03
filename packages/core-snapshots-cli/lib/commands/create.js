'use strict'
const SnapshotManager = require('../manager')
const env = require('../env')

module.exports = async (options) => {
  await new SnapshotManager().exportData(options)

  await env.tearDown()
}
