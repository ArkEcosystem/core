'use strict'

const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')

exports.getPath = (table, folder, codec) => {
  return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${folder}/${table}.${codec}`
}

exports.copySnapshot = (sourceFolder, destFolder, codec) => {
  const logger = container.resolvePlugin('logger')
  logger.info(`Copying snapshot from ${sourceFolder} to a new file  ${destFolder} for appending of data`)

  fs.ensureFileSync(this.getPath('blocks', destFolder, codec))
  fs.ensureFileSync(this.getPath('transactions', destFolder, codec))

  fs.copyFileSync(this.getPath('blocks', sourceFolder, codec), this.getPath('blocks', destFolder, codec))
  fs.copyFileSync(this.getPath('transactions', sourceFolder, codec), this.getPath('transactions', sourceFolder, codec))
}

exports.getSnapshotInfo = (folder) => {
  const [name, startHeight, endHeight] = folder.split('.')
  return {
    name: name,
    startHeight: +startHeight,
    endHeight: +endHeight,
    folder: `${startHeight}.${endHeight}`
  }
}

exports.setSnapshotInfo = (options, lastBlock) => {
  let meta = {
    startHeight: (options.start !== -1) ? options.start : 1,
    endHeight: (options.end !== -1) ? options.end : lastBlock.height,
    codec: options.codec
  }
  meta.folder = `snapshot.${meta.startHeight}.${meta.endHeight}`

  if (options.folder) {
    const oldMeta = this.getSnapshotInfo(options.folder)
    meta.startHeight = oldMeta.endHeight + 1
    meta.folder = `snapshot.${oldMeta.startHeight}.${meta.endHeight}`
  }

  return meta
}
