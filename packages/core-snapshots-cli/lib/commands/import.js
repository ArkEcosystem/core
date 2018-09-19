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
const utils = require('../utils')

module.exports = async (options) => {
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  const writeInterval = 50000
  const lastDbBlockHeight = !await database.getLastBlock() ? 0 : (await database.getLastBlock()).data.height
  logger.debug(`Last block in database ${lastDbBlockHeight}.`)
  progressBbar.start(utils.getSnapshotHeights(options.filename).end, 0) // getting last height from filename

  let block = {}
  const sourceStream = fs.createReadStream(`${utils.getStoragePath()}/${options.filename}`)
  const pipeline = sourceStream
    .pipe(zlib.createGunzip())
    .pipe(StreamValues.withParser())

  const writeQueue = async.queue(async (data, qcallback) => {
    progressBbar.update(data.value.height)
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
    .on('end', async () => {
      progressBbar.stop()
      await database.saveBlockCommit()

      await database.rollbackChain(parseInt(block.data.height))
      await utils.rollbackCurrentRound(block)

      logger.info(`Importing of snapshot file: [${options.filename}] succesfully completed.`)
      await env.tearDown()
    })
}
