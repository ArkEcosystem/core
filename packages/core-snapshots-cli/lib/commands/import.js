'use strict'
const init = require('../init')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')
const StreamValues = require('stream-json/streamers/StreamValues')
const zlib = require('zlib')
const async = require('async')
const fs = require('fs-extra')
const cliProgress = require('cli-progress')
const { Block, Transaction } = require('@arkecosystem/crypto').models

module.exports = async (options) => {
  const sourceStream = fs.createReadStream(`${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${options.filename}`)
  const progressBbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
  progressBbar.start(parseInt(options.filename.split('.')[1]), 0) // getting last height from filename
  const writeInterval = 50000
  let block = {}

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

    // committing to db every writeInterval number of blocks
    if (block.data.height % writeInterval === 0) {
      await database.saveBlockCommit()
      pipeline.resume()
    }

    qcallback()
  }, 1)

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

      blockchain.stateMachine.state.lastBlock = block

      await blockchain.rollbackCurrentRound()
      await blockchain.database.buildWallets(blockchain.state.lastBlock.data.height)
      await blockchain.database.saveWallets(true)

      await blockchain.database.applyRound(blockchain.stateMachine.state.lastBlock.data.height)

      logger.info(`Importing of snapshot file: [${options.filename}] succesfully completed.`)
      await init.tearDown()
    })
}
