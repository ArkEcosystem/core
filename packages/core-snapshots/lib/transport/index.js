'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const JSONStream = require('JSONStream')
const msgpack = require('msgpack-lite')
const delay = require('delay')
const zlib = require('zlib');

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const utils = require('../utils')
const { verifyData, canImportRecord } = require('./verification')
const codecs = require('./codec')

module.exports = {
  exportTable: async (table, options) => {
    const snapFileName = utils.getPath(table, options.meta.folder, options.codec)
    const codec = codecs.get(options.codec)
    const gzip = zlib.createGzip()

    await fs.ensureFile(snapFileName)
    const snapshotWriteStream = fs.createWriteStream(snapFileName, options.append ? { flags: 'a' } : {})
    const encodeStream = msgpack.createEncodeStream(codec ? { codec: codec[table] } : {})
    const qs = new QueryStream(options.queries[table])

    logger.info(`Starting to export table ${table} to folder ${options.meta.folder}, codec: ${options.codec}, append:${!!options.append}`)
    try {
      const data = await options.database.db.stream(qs, s => s.pipe(encodeStream).pipe(gzip).pipe(snapshotWriteStream))
      logger.info(`Snapshot: ${table} done. ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`)

      return data
    } catch (error) {
      container.forceExit('Error while exporting data via query stream', error)
    }
  },

  importTable: async (table, options) => {
    const sourceFile = utils.getPath(table, options.meta.folder, options.codec)
    console.log(sourceFile)
    const codec = codecs.get(options.codec)
    const gunzip = zlib.createGunzip()
    const decodeStream = msgpack.createDecodeStream(codec ? { codec: codec[table] } : {})
    logger.info(`Starting to import table ${table}, codec: ${options.codec}`)

    const readStream = fs
      .createReadStream(sourceFile)
      .pipe(gunzip)
      .pipe(decodeStream)

    let values = []
    let prevData = null
    for await (const record of readStream) {
      if (!verifyData(table, record, prevData, options.signatureVerification)) {
        container.forceExit(`Error verifying data. Payload ${JSON.stringify(record, null, 2)}`)
      }
      if (canImportRecord(table, record, options.lastBlock)) {
        values.push(record)
      }
      prevData = record
    }

    const getNextData = async (t, pageIndex) => {
      await delay(600)
      readStream.pause()
      const data = values.slice()
      values = []
      return Promise.resolve(data.length === 0 ? null : data)
    }

    try {
      await options.database.db.task('massive-inserts', t => {
        return t.sequence(async index => {
          readStream.resume()

          try {
            const data = await getNextData(t, index)

            if (data) {
              logger.debug(`Importing ${data.length} records from ${table}.${options.codec}`)
              const insert = options.database.pgp.helpers.insert(data, options.database.getColumnSet(table))
              return t.none(insert)
            }
          } catch (error) {
            logger.error(error.message)
          }
        })
      })

      return true
    } catch (error) {
      logger.error(error.stack)
      return false
    }
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
        container.forceExit(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
      }
      prevData = data
    })

    rs.on('finish', () => {
      logger.info(`Snapshot file ${sourceFile} succesfully verified  :+1:`)
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
      container.forceExit('Error while exporting data via query stream', error)
    }
  }
}
