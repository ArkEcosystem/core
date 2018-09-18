'use strict'
const zlib = require('zlib')
const StreamValues = require('stream-json/streamers/StreamValues')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const utils = require('../utils')

module.exports = async (options) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  const snapshotHeight = options.filename ? parseInt(options.filename.split('.')[1]) : 0

  await fs.ensureFile(`${storageLocation}/slice.dat`)
  const sliceStrem = fs.createWriteStream(`${storageLocation}/slice.dat`)
  const sourceStream = fs.createReadStream(`${storageLocation}/${options.filename}`)

  if (options.end === 0) {
    options.end = snapshotHeight
  }

  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  progressBbar.start(options.end, 0)
  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

    pipeline.on('data', (data) => {
      if (data.value.height >= options.start && data.value.height <= options.end) {
        sliceStrem.write(`{"height":${data.value.height}, "blockBuffer":"${data.value.blockBuffer}"}`)

        progressBbar.update(data.value.height)
      }

      if (data.value.height > options.end) {
        sourceStream.close()
        sliceStrem.close()

        progressBbar.stop()
      }
  })

  sourceStream.on('close', async () => {
    utils.gzip('slice.dat', options.end)
  })
}
