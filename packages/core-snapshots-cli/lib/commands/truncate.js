const app = require('@phantomchain/core-container')

const snapshotManager = app.resolvePlugin('snapshots')

module.exports = async options => {
  await snapshotManager.truncateChain()
}
