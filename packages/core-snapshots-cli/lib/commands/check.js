'use strict'
const init = require('../init')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const StreamValues = require('stream-json/streamers/StreamValues')
const zlib = require('zlib')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const { Block } = require('@arkecosystem/crypto').models

module.exports = (options) => {
  const sourceStream = fs.createReadStream(`${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${options.filename}`)
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  progressBbar.start(parseInt(options.filename.split('.')[1]), 0) // getting last height from filename

  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

  let lastProcessedBlock = 0

  pipeline
    .on('data', (data) => {
      const blockDb = Block.deserialize(data.value.blockBuffer)
      blockDb.id = Block.getId(blockDb)
      const block = new Block(blockDb)
      progressBbar.update(block.data.height)

      if (data.value.height - lastProcessedBlock !== 1) {
        logger.error(`Snapshot ${options.filename} is corrupted, reason missing blocks ${block.data.height}.`)
        process.exit(0)
      }

      if (!block.verification.verified) {
        logger.error(`Block verification failed during snapshot import. Block: ${JSON.stringify(block)}`)
        process.exit(0)
      }
      lastProcessedBlock = block.data.height
    })
    .on('end', () => {
      progressBbar.stop()

      logger.info(`Checking of snapshot file: [${options.filename}] succesfully completed.`)
      init.tearDown()
    })
}
