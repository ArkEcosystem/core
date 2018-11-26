const app = require('@arkecosystem/core-container')

const snapshotManager = app.resolvePlugin('snapshots')

module.exports = async options => {
  await snapshotManager.truncateChain()
}
