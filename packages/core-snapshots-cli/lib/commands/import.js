'use strict'
const env = require('../env')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const StreamValues = require('stream-json/streamers/StreamValues')
const zlib = require('zlib')
const async = require('async')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const { Block, Transaction } = require('@arkecosystem/crypto').models
const helpers = require('../helpers')
const util = require('util')
const stream = require('stream')
const finished = util.promisify(stream.finished)

module.exports = async (options) => {
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  const writeInterval = 50000
  const lastDbBlockHeight = !await database.getLastBlock() ? 0 : (await database.getLastBlock()).data.height
  logger.info(`Last block in database ${lastDbBlockHeight}`)

  if (options.truncate) {
    logger.info('Truncating the database before starting import')
    await database.truncateChain()
  }

  progressBbar.start(helpers.getSnapshotHeights(options.filename).end, 0) // getting last height from filename
  const sourceStream = fs.createReadStream(`${helpers.getStoragePath()}/${options.filename}`)
  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

  const writeQueue = async.queue(async (data, qcallback) => {
    progressBbar.update(data.value.height)

    let block = {}
    block.data = Block.deserialize(data.value.blockBuffer)
    block.data.id = Block.getId(block.data)
    block.transactions = []

    if (block.data.transactions) {
      let sequence = 0
      block.transactions = block.data.transactions.map(transaction => {
        const stampedTransaction = new Transaction(transaction)
        stampedTransaction.blockId = block.data.id
        stampedTransaction.timestamp = block.data.timestamp
        stampedTransaction.sequence = sequence++
        return stampedTransaction
      })
    }

    database.saveBlockAsync(block)

    qcallback()
  }, 1)

  pipeline
    .on('data', async (data) => {
      if (data.value.height > lastDbBlockHeight) {
          writeQueue.push(data)
      }
      // committing to db every writeInterval number of blocks
      if (data.value.height % writeInterval === 0) {
        pipeline.pause()
        await database.saveBlockCommit()
        pipeline.resume()
      }
    })

  await finished(sourceStream) // waiting here for stream to finish reading
  progressBbar.stop()
  await database.saveBlockCommit()

  const lastDbBlock = await database.getLastBlock()
  await database.rollbackChain(lastDbBlock.data.height)
  await helpers.rollbackCurrentRound(await database.getLastBlock())

  logger.info(`Importing of snapshot file: [${options.filename}] succesfully completed.`)
  await env.tearDown()
}
