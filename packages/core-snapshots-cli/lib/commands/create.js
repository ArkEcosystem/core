'use strict'
const utils = require('../utils')
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
    logger.info('Database is empty. Exiting!')
    process.exit(1)
  }

  const startHeight = utils.getSnapshotHeight(options.filename)
  progressBbar.start(lastBlock.data.height, startHeight)

  await fs.ensureFile(`${utils.getStoragePath()}/snapshot.dat`)
  const snapshotWriteStream = fs.createWriteStream(`${utils.getStoragePath()}/snapshot.dat`, options.filename ? {flags: 'a'} : {})

  let lastSavedHeight = startHeight
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

      utils.gzip('snapshot.dat', lastSavedHeight)
    }
    return blocks.length
  }

  let offset = await __readDatabase(startHeight) + startHeight

  writeQueue.drain = async () => {
    offset += await __readDatabase(offset)
  }
}
