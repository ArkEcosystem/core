'use strict'
const zlib = require('zlib')

const StreamValues = require('stream-json/streamers/StreamValues')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = async (options) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  const snapshotHeight = options.filename ? parseInt(options.filename.split('.')[1]) : 0

  await fs.ensureFile(`${storageLocation}/slice.dat`)
  const rollbackStream = fs.createWriteStream(`${storageLocation}/slice.dat`)
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
        rollbackStream.write(`{"height":${data.value.height}, "blockBuffer":"${data.value.blockBuffer}"}`)

        progressBbar.update(data.value.height)
      }

      if (data.value.height > options.end) {
        sourceStream.close()
        rollbackStream.close()

        progressBbar.stop()
      }
  })

  const __gzip = (sourceFileName, height) => {
    fs.createReadStream(`${storageLocation}/${sourceFileName}`)
      .pipe(zlib.createGzip())
      .pipe(fs.createWriteStream(`${storageLocation}/snapshot.${height}.gz`))
      .on('finish', () => {
        fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
        logger.info(`New snapshot was succesfully created. File: [snapshot.${height}.gz]`)

        process.exit(0)
      })
  }

  sourceStream.on('close', async () => {
    __gzip('slice.dat', options.end)
  })
}
