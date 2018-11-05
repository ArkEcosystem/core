'use strict'
const container = require('@arkecosystem/core-container')
const snapshotManager = container.resolvePlugin('snapshots')
const emitter = container.resolvePlugin('event-emitter')
const _cliProgress = require('cli-progress')

module.exports = async (options) => {
  const progressBar = new _cliProgress.Bar({
    format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s'
  },
  _cliProgress.Presets.shades_classic)

  emitter.on('start', data => {
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
