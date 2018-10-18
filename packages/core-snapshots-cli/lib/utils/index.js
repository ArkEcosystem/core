'use strict'

const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')

exports.setUpLite = async (options) => {
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston'
    ]
  })

  return container
}

exports.tearDown = async () => container.tearDown()

exports.getPath = (fileName) => {
  return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${fileName}`
}

exports.copySnapshot = (fileName, endheight) => {
  // logger.info(`Copying snapshot ${fileName} to a new file for appending of data`)
  const metaOld = fileName.split('.')

  fs.copyFileSync(this.getPath(`blocks.${metaOld[1]}.${metaOld[2]}`), this.getPath(`blocks.${metaOld[1]}.${endheight}`))
  fs.copyFileSync(this.getPath(`transactions.${metaOld[1]}.${metaOld[2]}`), this.getPath(`blocks.${metaOld[1]}.${endheight}`))
}
