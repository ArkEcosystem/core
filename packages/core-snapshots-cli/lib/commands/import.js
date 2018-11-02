'use strict'
const container = require('@arkecosystem/core-container')
const snapshotManager = container.resolvePlugin('snapshots')
const emitter = container.resolvePlugin('event-emitter')
const _cliProgress = require('cli-progress')

module.exports = async (options) => {
  const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

  emitter.on('start', data => {
    console.log()
    progressBar.start(data.count, 1)
  })

  emitter.on('progress', data => {
    progressBar.update(data.value)
  })

  emitter.on('complete', data => {
    progressBar.stop()
  })

  await snapshotManager.importData(options)
}
