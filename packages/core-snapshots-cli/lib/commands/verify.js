'use strict'
const env = require('../env')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const StreamValues = require('stream-json/streamers/StreamValues')
const zlib = require('zlib')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const { Block } = require('@arkecosystem/crypto').models
const utils = require('../utils')

module.exports = (options) => {
  const sourceStream = fs.createReadStream(`${utils.getStoragePath()}/${options.filename}`)
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  logger.debug(`Starting verification of snapshot ${options.filename}`)
  progressBbar.start(utils.getSnapshotHeights(options.filename).end, utils.getSnapshotHeights(options.filename).start) // getting last height from filename

  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

  let lastProcessedBlock = utils.getSnapshotHeights(options.filename).start - 1

  pipeline
    .on('data', (data) => {
      const blockDb = Block.deserialize(data.value.blockBuffer)
      try {
        blockDb.id = Block.getId(blockDb)
        const block = new Block(blockDb)

        progressBbar.update(block.data.height)

        if (data.value.height - lastProcessedBlock !== 1) {
          logger.error(`Snapshot ${options.filename} is corrupted, reason missing blocks before block: ${block.data.height}.`)
          process.exit(0)
        }

        if (!block.verification.verified) {
          logger.error(`Block verification failed during snapshot import. Block: ${JSON.stringify(block, null, 2)}`)
          process.exit(0)
        }
        lastProcessedBlock = block.data.height
      } catch (error) {
        logger.error(`Block: ${JSON.stringify(blockDb, null, 2)}`)
        logger.error(error)
        logger.error(error.stack)
      }
    })
    .on('end', async () => {
      progressBbar.stop()

      logger.info(`Verification of snapshot file: [${options.filename}] succesfully completed.`)
      await env.tearDown()
    })
}
