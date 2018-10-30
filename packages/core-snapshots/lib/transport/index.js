'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const JSONStream = require('JSONStream')
const msgpack = require('msgpack-lite')
const delay = require('delay')
const zlib = require('zlib');

const container = require('@arkecosystem/core-container')
const emitter = container.resolvePlugin('event-emitter')
const logger = container.resolvePlugin('logger')
const utils = require('../utils')
const { verifyData, canImportRecord } = require('./verification')
const codecs = require('./codec')

module.exports = {
  exportTable: async (table, options) => {
    const snapFileName = `${table}.${options.meta.stringInfo}`
    const codec = codecs.get(options.codec)
    const gzip = zlib.createGzip()

    await fs.ensureFile(utils.getPath(snapFileName))
    const snapshotWriteStream = fs.createWriteStream(utils.getPath(snapFileName), options.filename ? { flags: 'a' } : {})
    const encodeStream = msgpack.createEncodeStream(codec ? { codec: codec[table] } : {})
    const qs = new QueryStream(options.queries[table])

    logger.info(`Starting to export table to ${snapFileName}, append:${!!options.filename}`)
    try {
      const data = await options.database.db.stream(qs, s => s.pipe(encodeStream).pipe(gzip).pipe(snapshotWriteStream))
      logger.info(`Snapshot: ${snapFileName} ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`)

      emitter.emit('export:done', data)
      return data
    } catch (error) {
      logger.error(`Error while exporting data via query stream ${error}, callstack: ${error.stack}`)
      throw new Error(error)
    }
  },

  importTable: async (table, options) => {
    const sourceFile = `${table}.${options.meta.stringInfo}`
    const codec = codecs.get(options.codec)
    const gunzip = zlib.createGunzip()
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {})
    const rs = fs.createReadStream(utils.getPath(sourceFile)).pipe(gunzip).pipe(decodeStream)

    let values = []
    let prevData = null
    rs.on('data', (record) => {
      if (!verifyData(table, record, prevData, options.signatureVerification)) {
        logger.error(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`)
        throw new Error(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`)
      }
      if (canImportRecord(table, record, options.lastBlock)) {
        values.push(record)
      }
      prevData = record
    })

    const getNextData = async (t, pageIndex) => {
      await delay(600)
      rs.pause()
      const data = values.slice()
      values = []
      return Promise.resolve(data.length === 0 ? null : data)
    }

    options.database.db.task('massive-inserts', t => {
      return t.sequence(index => {
        rs.resume()
        return getNextData(t, index)
          .then(data => {
            if (data) {
              logger.debug(`Importing ${data.length} records from ${sourceFile}`)
              const insert = options.database.pgp.helpers.insert(data, options.database.getColumnSet(table))
              return t.none(insert)
            }
          })
      }).then((res) => {
        emitter.emit('import:table:done', table)
      })
    })
  },

  verifyTable: async (table, options) => {
    const sourceFile = `${table}.${options.meta.stringInfo}`
    const codec = codecs.get(options.codec)
    const gunzip = zlib.createGunzip()
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {})
    const rs = fs.createReadStream(utils.getPath(sourceFile)).pipe(gunzip).pipe(decodeStream)

    logger.info(`Starting to verify snapshot file ${sourceFile}`)
    let prevData = null

    decodeStream.on('data', (data) => {
      if (!verifyData(table, data, prevData, options.signatureVerification)) {
        logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
        throw new Error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
      }
      prevData = data
    })

    rs.on('finish', () => {
      logger.info(`Snapshot succesfully verified ${sourceFile} :+1:`)
      emitter.emit('verify:success', table)
    })
  },

  backupTransactionsToJSON: async (snapFileName, query, database) => {
    await fs.ensureFile(utils.getPath(snapFileName))
    const snapshotWriteStream = fs.createWriteStream(utils.getPath(snapFileName))
    const qs = new QueryStream(query)

    try {
      const data = await database.db.stream(qs, s => s.pipe(JSONStream.stringify()).pipe(snapshotWriteStream))
      logger.info(`Transactions(n=${data.processed}) from rollbacked blocks where safely exported to file ${snapFileName}`)
      return data
    } catch (error) {
      logger.error(`Error while exporting data via query stream ${error}, callstack: ${error.stack}`)
      throw new Error(error)
    }
  }
}
