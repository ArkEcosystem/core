'use strict'
const zlib = require('zlib')
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

module.exports = {
  gzip: (sourceFileName, startHeight, endHeight) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  const fileName = `snapshot.${startHeight}.${endHeight}.gz`

  fs.createReadStream(`${storageLocation}/${sourceFileName}`)
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream(`${storageLocation}/${fileName}`))
    .on('finish', async () => {
      fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
      logger.info(`New snapshot was succesfully created. File: [${fileName}]`)

      // await env.tearDown()
      process.exit(0)
    })
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
  }
}
