'use strict'
const helpers = require('../helpers')
const { Block } = require('@arkecosystem/crypto').models
const async = require('async')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')

module.exports = async (options) => {
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  const lastBlock = await database.getLastBlock()
  const readInterval = 50000

  if (!lastBlock) {
    logger.info('Database is empty or not accessible. Exiting!')
    process.exit(0)
  }

  const snapshotHeights = helpers.getSnapshotHeights(options.filename)
  progressBbar.start(lastBlock.data.height, snapshotHeights.end)

  await fs.ensureFile(`${helpers.getStoragePath()}/snapshot.dat`)
  const snapshotWriteStream = fs.createWriteStream(`${helpers.getStoragePath()}/snapshot.dat`, options.filename ? {flags: 'a'} : {})

  let lastSavedHeight = snapshotHeights.end
  const writeQueue = async.queue((block, qcallback) => {
    block.transactions = !block.transactions ? [] : block.transactions
    if (block.height - lastSavedHeight !== 1) {
      logger.error(`Export database is corrupted. Missing blocks on previous block of ${block.height}`)
      process.exit(0)
    }

    snapshotWriteStream.write(`{"height":${block.height}, "blockBuffer":"${Block.serializeFull(block).toString('hex')}"}`)
    lastSavedHeight = block.height
    qcallback()
  }, 1)

  const __readDatabase = async (offset) => {
    let blocks = await database.getBlocks(offset + 1, readInterval)
    if (blocks.length > 0) {
      writeQueue.push(blocks)

      progressBbar.update(offset + blocks.length)
    } else {
      progressBbar.stop()
      snapshotWriteStream.end()

      await helpers.gzip('snapshot.dat', snapshotHeights.start, lastSavedHeight)
    }
    return blocks.length
  }

  let offset = await __readDatabase(snapshotHeights.end) + snapshotHeights.end

  writeQueue.drain = async () => {
    offset += await __readDatabase(offset)
  }
}
