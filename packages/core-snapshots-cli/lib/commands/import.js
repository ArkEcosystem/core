'use strict'
const init = require('../init')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const StreamValues = require('stream-json/streamers/StreamValues')
const zlib = require('zlib')
const async = require('async')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const { Block } = require('@arkecosystem/crypto').models

module.exports = async (options) => {
  const sourceStream = fs.createReadStream(`${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${options.filename}`)
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  progressBbar.start(parseInt(options.filename.split('.')[1]), 0) // getting last height from filename
  const writeInterval = 10000

  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

  let lastProcessedBlock = 0
  const writeQueue = async.queue(async (data, qcallback) => {
    const blockDb = Block.deserialize(data.value.blockBuffer)
    blockDb.id = Block.getId(blockDb)
    const block = new Block(blockDb)
    progressBbar.update(block.data.height)

    console.log(`entering ${data.value.height}:${block.data.height}`)

    if (data.value.height - lastProcessedBlock !== 1) {
      logger.error(`Snapshot ${options.filename} is corrupted, reason missing blocks ${block.data.height}.`)
      process.exit(0)
    }

    if (!block.verification.verified) {
      logger.error(`Block verification failed during snapshot import. Block: ${JSON.stringify(block)}`)
    }

    database.saveBlockAsync(block)
     // committing to db every 10,000 blocks
    if (block.data.height % writeInterval === 0) {
      logger.debug('commiting')
      await database.saveBlockCommit()
      pipeline.resume()
    }

    lastProcessedBlock = block.data.height
    qcallback()
  }, 1)

  writeQueue.drain = async () => {
    // await database.saveBlockCommit()
  }

  pipeline
    .on('data', (data) => {
      if (data.value.height % writeInterval === 0) {
        pipeline.pause()
      }
      writeQueue.push(data)
    })
    .on('end', async () => {
      progressBbar.stop()
      await database.saveBlockCommit()

      logger.info(`Importing of snapshot file: [${options.filename}] succesfully completed.`)
      init.tearDown()
    })
}
