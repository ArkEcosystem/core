'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const JSONStream = require('JSONStream')
const msgpack = require('msgpack-lite')
const delay = require('delay')

// const stream = require('spex')(Promise).stream

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const utils = require('../utils')
const { verifyData, canImportRecord } = require('./verification')

module.exports = {
  exportTable: async (snapFileName, query, database, append = false) => {
    logger.info(`Starting to export table to ${snapFileName}, append:${append}`)

    await fs.ensureFile(utils.getPath(snapFileName))
    const snapshotWriteStream = fs.createWriteStream(utils.getPath(snapFileName), append ? { flags: 'a' } : {})
    const encodeStream = msgpack.createEncodeStream()
    const qs = new QueryStream(query)

    try {
      const data = await database.db.stream(qs, s => s.pipe(encodeStream).pipe(snapshotWriteStream))
      logger.info(`Snapshot: ${snapFileName} ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`)
      return data
    } catch (error) {
      logger.error(`Error while exporting data via query stream ${error}, callstack: ${error.stack}`)
      process.exit(1)
    }
  },

  importTable: async (sourceFile, database, lastBlock, skipVerifySignature = false, chunkSize = 50000) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(utils.getPath(sourceFile)).pipe(decodeStream)
    const tableName = sourceFile.split('.')[0]

    let values = []
    let prevData = lastBlock
    decodeStream.on('data', (data) => {
      if (!verifyData(tableName, data, prevData, skipVerifySignature)) {
        logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
        process.exit(1)
      }
      if (canImportRecord(tableName, data, lastBlock)) {
        values.push(data)
      }
      prevData = data
    })

    const getNextData = async (t, pageIndex) => {
      await delay(600)
      rs.pause()
      const data = values.slice()
      values = []
      return Promise.resolve(data.length === 0 ? null : data)
    }

    await database.db.task('massive-insert', t => {
      return t.sequence(index => {
        rs.resume()
        return getNextData(t, index)
        .then(data => {
          if (data) {
            logger.info(`Importing ${data.length} records from ${sourceFile}`)
            const insert = database.pgp.helpers.insert(data, database.getColumnSet(tableName))
            return t.none(insert)
          }
        })
      })
    })
    logger.info(`Table ${tableName} restored from ${sourceFile} :+1:`)
  },

  verifyTable: async (filename, database, skipVerifySignature = false) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(utils.getPath(filename)).pipe(decodeStream)
    const lastBlock = await database.getLastBlock()

    return new Promise((resolve, reject) => {
      logger.info(`Starting to verify snapshot file ${filename}`)
      let prevData = lastBlock
      const table = filename.split('.')[0]
      decodeStream.on('data', (data) => {
        if (!verifyData(table, data, prevData, skipVerifySignature)) {
          logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
          process.exit(1)
        }
        prevData = data
      })

      rs.on('finish', () => {
        logger.info(`Snapshot succesfully verified ${filename} :+1:`)
        resolve(true)
      })
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
      process.exit(1)
    }
  }
}
