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

exports.getPath = (filename) => {
  return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${filename}`
}

exports.copySnapshot = (currentFileInfo, newFileInfo) => {
  const logger = container.resolvePlugin('logger')
  logger.info(`Copying snapshot from ${currentFileInfo} to a new file  ${newFileInfo} for appending of data`)

  fs.copyFileSync(this.getPath(`blocks.${currentFileInfo}`), this.getPath(`blocks.${newFileInfo}`))
  fs.copyFileSync(this.getPath(`transactions.${currentFileInfo}`), this.getPath(`transactions.${newFileInfo}`))
}

exports.getSnapshotInfo = (filename) => {
  const fileInfo = filename.split('.')
  return {
    startHeight: +fileInfo[1],
    endHeight: +fileInfo[2],
    stringInfo: `${(fileInfo[1])}.${fileInfo[2]}.dat`
  }
}

exports.setSnapshotInfo = (options, lastBlock) => {
  let meta = {
    startHeight: (options.start !== -1) ? options.start : 1,
    endHeight: (options.end !== -1) ? options.end : lastBlock.height
  }
  meta.stringInfo = `${meta.startHeight}.${meta.endHeight}.dat`

  if (options.filename) {
    const oldMeta = this.getSnapshotInfo(options.filename)
    meta.startHeight = oldMeta.endHeight + 1
    meta.stringInfo = `${oldMeta.startHeight}.${meta.endHeight}.dat`
  }

  return meta
}
