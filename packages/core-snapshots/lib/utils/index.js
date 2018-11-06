'use strict'

const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')

exports.getPath = (table, folder, codec) => {
  const filename = `${table}.${codec}`
  return this.getFilePath(filename, folder)
}

exports.writeMetaFile = (snapshotInfo) => {
  const path = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${snapshotInfo.folder}/meta.json`
  fs.writeFileSync(path, JSON.stringify(snapshotInfo, 'utf8'))
}

exports.getFilePath = (filename, folder) => {
  return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${folder}/${filename}`
}

exports.copySnapshot = (sourceFolder, destFolder, codec) => {
  const logger = container.resolvePlugin('logger')
  logger.info(`Copying snapshot from ${sourceFolder} to a new file ${destFolder} for appending of data`)

  const paths = {
    source: {
      blocks: this.getPath('blocks', sourceFolder, codec),
      transactions: this.getPath('transactions', sourceFolder, codec)
    },
    dest: {
      blocks: this.getPath('blocks', destFolder, codec),
      transactions: this.getPath('transactions', destFolder, codec)
    }
  }

  fs.ensureFileSync(paths.dest.blocks)
  fs.ensureFileSync(paths.dest.transactions)

  if (!fs.existsSync(paths.source.blocks) || !fs.existsSync(paths.source.transactions)) {
    container.forceExit(`Unable to copy snapshot from ${sourceFolder} as it doesn't exist :bomb:`)
  }

  fs.copyFileSync(paths.source.blocks, paths.dest.blocks)
  fs.copyFileSync(paths.source.transactions, paths.dest.transactions)
}

exports.calcRecordCount = (table, currentCount, sourceFolder) => {
  if (sourceFolder) {
    const snapshotInfo = this.readMetaJSON(sourceFolder)
    return +snapshotInfo[table].count + currentCount
  }

  return currentCount
}

exports.calcStartHeight = (table, currentHeight, sourceFolder) => {
  if (sourceFolder) {
    const snapshotInfo = this.readMetaJSON(sourceFolder)
    return +snapshotInfo[table].startHeight
  }

  return currentHeight
}

exports.getSnapshotInfo = (folder) => {
  const snapshotInfo = this.readMetaJSON(folder)
  return {
    startHeight: +snapshotInfo.blocks.startHeight,
    endHeight: +snapshotInfo.blocks.endHeight,
    folder: snapshotInfo.folder,
    blocks: snapshotInfo.blocks,
    transactions: snapshotInfo.transactions,
    skipCompression: snapshotInfo.skipCompression
  }
}

exports.readMetaJSON = (folder) => {
  const metaFileInfo = this.getFilePath('meta.json', folder)
  if (!fs.existsSync(metaFileInfo)) {
    container.forceExit('Meta file meta.json not found. Exiting :bomb:')
  }

  return fs.readJSONSync(metaFileInfo)
}

exports.setSnapshotInfo = (options, lastBlock) => {
  let meta = {
    startHeight: (options.start !== -1) ? options.start : 1,
    endHeight: (options.end !== -1) ? options.end : lastBlock.height,
    codec: options.codec,
    skipCompression: options.skipCompression || false
  }
  meta.folder = `${meta.startHeight}-${meta.endHeight}`

  if (options.blocks) {
    const oldMeta = this.getSnapshotInfo(options.blocks)
    meta.startHeight = oldMeta.endHeight + 1
    meta.folder = `${oldMeta.startHeight}-${meta.endHeight}`
  }

  return meta
}
