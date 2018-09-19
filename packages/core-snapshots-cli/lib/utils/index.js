'use strict'
const zlib = require('zlib')
const env = require('../init')
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

module.exports = {
  gzip: (sourceFileName, height) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`

  fs.createReadStream(`${storageLocation}/${sourceFileName}`)
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream(`${storageLocation}/snapshot.${height}.gz`))
    .on('finish', async () => {
      fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
      logger.info(`New snapshot was succesfully created. File: [snapshot.${height}.gz]`)

      await env.tearDown()
    })
  },

  getStoragePath: () => {
    return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  },

  getSnapshotHeight: (filename) => {
    return filename ? parseInt(filename.split('.')[1]) : 0
  },

  rollbackCurrentRound: async (block) => {
    blockchain.stateMachine.state.lastBlock = block

    await blockchain.rollbackCurrentRound()
    await database.saveBlockCommit()
    await blockchain.database.buildWallets(blockchain.state.lastBlock.data.height)
    await blockchain.database.saveWallets(true)

    await blockchain.database.applyRound(database.getLastBlock().height)
  }
}
