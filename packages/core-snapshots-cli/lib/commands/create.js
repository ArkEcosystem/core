'use strict'
const init = require('../init')
const zlib = require('zlib')
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
  if (!lastBlock) {
    logger.info('Database is empty. Exiting!')
    process.exit(1)
  }

  const startHeight = options.filename ? parseInt(options.filename.split('.')[1]) : 0
  progressBbar.start(lastBlock.data.height, startHeight)

  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  await fs.ensureFile(`${storageLocation}/snapshot.dat`)
  const snapshotWriteStream = fs.createWriteStream(`${storageLocation}/snapshot.dat`, options.filename ? {flags: 'a'} : {})

  let lastSavedHeight = 0
  const writeQueue = async.queue((block, qcallback) => {
    block.transactions = !block.transactions ? [] : block.transactions
    if (block.height - lastSavedHeight !== 1) {
      logger.error(`Export database is corrupted. Missing blocks on previos block of ${block.height}`)
      process.exit(0)
    }

    snapshotWriteStream.write(`{"height":${block.height}, "blockBuffer":"${Block.serializeFull(block).toString('hex')}"}`)
    lastSavedHeight = block.height
    qcallback()
  }, 1)

  const __gzip = (sourceFileName, height) => {
    fs.createReadStream(`${storageLocation}/${sourceFileName}`)
      .pipe(zlib.createGzip())
      .pipe(fs.createWriteStream(`${storageLocation}/snapshot.${height}.gz`))
      .on('finish', () => {
        fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
        logger.info(`New snapshot was succesfully created. File: [snapshot.${height}.gz]`)

        init.tearDown(options)
      })
  }

  const __readDatabase = async (offset) => {
    let blocks = await database.getBlocks(offset + 1, 20000)
    if (blocks.length > 0) {
      writeQueue.push(blocks)

      progressBbar.update(offset + blocks.length)
    } else {
      progressBbar.stop()
      snapshotWriteStream.end()

      __gzip('snapshot.dat', lastSavedHeight)
    }
    return blocks.length
  }

  let offset = await __readDatabase(startHeight) + startHeight

  writeQueue.drain = async () => {
    offset += await __readDatabase(offset)
  }
}
