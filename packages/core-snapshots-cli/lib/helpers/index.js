'use strict'
const zlib = require('zlib')
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')
const env = require('../env')
const util = require('util')
const stream = require('stream')
const finished = util.promisify(stream.finished)

module.exports = {
  gzip: async (sourceFileName, startHeight, endHeight) => {
    const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
    const fileName = `snapshot.${startHeight}.${endHeight}.gz`

    const sourceStream = fs.createReadStream(`${storageLocation}/${sourceFileName}`)

    sourceStream
      .pipe(zlib.createGzip())
      .pipe(fs.createWriteStream(`${storageLocation}/${fileName}`))

    await finished(sourceStream)
    fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
    logger.info(`New snapshot was succesfully created. File: [${fileName}]`)

    await env.tearDown()
  },

  getStoragePath: () => {
    return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  },

  getSnapshotHeights: (filename) => {
    let response = {start: 0, end: 0}

    if (filename) {
      response.start = parseInt(filename.split('.')[1])
      response.end = parseInt(filename.split('.')[2])
    }

    return response
  },

  rollbackCurrentRound: async () => {
    blockchain.stateMachine.state.lastBlock = await database.getLastBlock()

    await blockchain.rollbackCurrentRound()
    await database.saveBlockCommit()
    await blockchain.database.buildWallets(blockchain.state.lastBlock.data.height)
    await blockchain.database.saveWallets(true)

    await blockchain.database.applyRound(blockchain.state.lastBlock.data.height)

    return blockchain.state.lastBlock.data.height
  },

  truncateTables: async () => {
    await blockchain.database.truncateChain()
  }
}
