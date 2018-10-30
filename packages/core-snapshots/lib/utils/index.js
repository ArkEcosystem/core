'use strict'

const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')

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
    codec: fileInfo[3],
    stringInfo: `${(fileInfo[1])}.${fileInfo[2]}.${fileInfo[3]}`
  }
}

exports.setSnapshotInfo = (options, lastBlock) => {
  let meta = {
    startHeight: (options.start !== -1) ? options.start : 1,
    endHeight: (options.end !== -1) ? options.end : lastBlock.height,
    codec: options.codec
  }
  meta.stringInfo = `${meta.startHeight}.${meta.endHeight}.${meta.codec}`

  if (options.filename) {
    const oldMeta = this.getSnapshotInfo(options.filename)
    meta.startHeight = oldMeta.endHeight + 1
    meta.stringInfo = `${oldMeta.startHeight}.${meta.endHeight}.${meta.codec}`
  }

  return meta
}
