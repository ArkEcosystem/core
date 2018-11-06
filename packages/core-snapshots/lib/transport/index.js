'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const JSONStream = require('JSONStream')
const msgpack = require('msgpack-lite')
const zlib = require('zlib')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')
const utils = require('../utils')
const { verifyData, canImportRecord } = require('./verification')
const codecs = require('./codec')

module.exports = {
  exportTable: async (table, options) => {
    const snapFileName = utils.getPath(table, options.meta.folder, options.codec)
    const codec = codecs.get(options.codec)
    const gzip = zlib.createGzip()
    await fs.ensureFile(snapFileName)

    logger.info(`Starting to export table ${table} to folder ${options.meta.folder}, codec: ${options.codec}, append:${!!options.blocks}, skipCompression: ${options.meta.skipCompression}`)
    try {
      const snapshotWriteStream = fs.createWriteStream(snapFileName, options.blocks ? { flags: 'a' } : {})
      const encodeStream = msgpack.createEncodeStream(codec ? { codec: codec[table] } : {})
      const qs = new QueryStream(options.queries[table])

      const data = await options.database.db.stream(qs, s => {
        if (options.meta.skipCompression) {
          return s.pipe(encodeStream).pipe(snapshotWriteStream)
        }

        return s.pipe(encodeStream).pipe(gzip).pipe(snapshotWriteStream)
      })
      logger.info(`Snapshot: ${table} done. ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`)

      return { count: utils.calcRecordCount(table, data.processed, options.blocks), startHeight: utils.calcStartHeight(table, options.meta.startHeight, options.blocks), endHeight: options.meta.endHeight }
    } catch (error) {
      container.forceExit('Error while exporting data via query stream', error)
    }
  },

  importTable: async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder, options.codec)
    const codec = codecs.get(options.codec)
    const gunzip = zlib.createGunzip()
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {})
    logger.info(`Starting to import table ${table} from ${sourceFile}, codec: ${options.codec}, skipCompression: ${options.meta.skipCompression}`)

    const readStream = options.meta.skipCompression
      ? fs.createReadStream(sourceFile).pipe(decodeStream)
      : fs.createReadStream(sourceFile).pipe(gunzip).pipe(decodeStream)

    let values = []
    let prevData = null
    let counter = 0
    const saveData = async (data) => {
      if (data && data.length > 0) {
        const insert = options.database.pgp.helpers.insert(data, options.database.getColumnSet(table))
        emitter.emit('progress', { value: counter, table: table })
        values = []
        return options.database.db.none(insert)
      }
    }

    emitter.emit('start', { count: options.meta[table].count })
    for await (const record of readStream) {
      counter++
      if (!verifyData(table, record, prevData, options.signatureVerification)) {
        container.forceExit(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`)
      }
      if (canImportRecord(table, record, options.lastBlock)) {
        values.push(record)
      }

      if (values.length % options.chunkSize === 0) {
        await saveData(values)
      }
      prevData = record
    }

    if (values.length > 0) {
      await saveData(values)
    }
    emitter.emit('complete')
  },

  verifyTable: async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder, options.codec)
    const codec = codecs.get(options.codec)
    const gunzip = zlib.createGunzip()
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {})
    const readStream = options.meta.skipCompression
      ? fs.createReadStream(sourceFile).pipe(decodeStream)
      : fs.createReadStream(sourceFile).pipe(gunzip).pipe(decodeStream)

    logger.info(`Starting to verify snapshot file ${sourceFile}`)
    let prevData = null

    decodeStream.on('data', (data) => {
      if (!verifyData(table, data, prevData, options.signatureVerification)) {
        container.forceExit(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
      }
      prevData = data
    })

    readStream.on('finish', () => {
      logger.info(`Snapshot file ${sourceFile} succesfully verified  :+1:`)
    })
  },

  backupTransactionsToJSON: async (snapFileName, query, database) => {
    const transactionBackupPath = utils.getFilePath(snapFileName, 'rollbackTransactions')
    await fs.ensureFile(transactionBackupPath)
    const snapshotWriteStream = fs.createWriteStream(transactionBackupPath)
    const qs = new QueryStream(query)

    try {
      const data = await database.db.stream(qs, s => s.pipe(JSONStream.stringify()).pipe(snapshotWriteStream))
      logger.info(`Transactions(n=${data.processed}) from rollbacked blocks where safely exported to file ${snapFileName}`)
      return data
    } catch (error) {
      container.forceExit('Error while exporting data via query stream', error)
    }
  }
}
