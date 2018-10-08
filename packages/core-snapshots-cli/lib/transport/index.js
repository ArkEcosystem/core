'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const msgpack = require('msgpack-lite')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const env = require('../env')
const { verifyData, canImportRecord } = require('./verification')

module.exports = {
  exportTable: async (snapFileName, query, database, append = false) => {
    logger.info(`Starting to export table to ${snapFileName}, append:${append}`)

    await fs.ensureFile(env.getPath(snapFileName))
    const snapshotWriteStream = fs.createWriteStream(env.getPath(snapFileName), append ? {flags: 'a'} : {})
    const encodeStream = msgpack.createEncodeStream()
    const qs = new QueryStream(query)

    try {
      const data = await database.db.stream(qs, s => s.pipe(encodeStream).pipe(snapshotWriteStream))
      logger.info(`Snapshot: ${snapFileName} ==> Total rows processed: ${data.processed}, duration: ${data.duration} ms`)
      return data
    } catch (error) {
      logger.error(`Error while exporting data via query stream ${error}, callstack: ${error.stack}`)
      logger.error(error.stack)
      process.exit(1)
    }
  },

  importTable: async (fileName, database, lastBlock, skipVerifySignature = false, chunkSize = 50000) => {
    return new Promise((resolve, reject) => {
      const decodeStream = msgpack.createDecodeStream()
      const rs = fs.createReadStream(env.getPath(fileName)).pipe(decodeStream)

      let values = []
      const saveChunk = (end = false) => {
        rs.pause()

        logger.info(`Importing ${values.length} records from ${fileName}`)
        const insert = database.pgp.helpers.insert(values.slice(), database.getColumnSet(fileName.split('.')[0]))
        database.db.none(insert).catch((error) => {
          reject(error)
        })

        values = []
        end ? resolve(true) : rs.resume()
      }
      let prevData = lastBlock
      const table = fileName.split('.')[0]
      decodeStream.on('data', (data) => {
        if (!verifyData(table, data, prevData, skipVerifySignature)) {
          logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
          process.exit(1)
        }

        if (canImportRecord(table, data, lastBlock)) {
          // values.push(transformData(table, data))
          values.push(data)
        }
        prevData = data
        if (values.length % chunkSize === 0) {
          saveChunk()
        }
      })

      // saving last batch
      rs.on('finish', () => {
        if (values.length > 0) {
          saveChunk(true)
        }
      })
    })
  },

  verifyTable: async (fileName, database, skipVerifySignature = false) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(env.getPath(fileName)).pipe(decodeStream)
    const lastBlock = await database.getLastBlock()

    logger.info(`Starting to verify snapshot file ${fileName}`)
    let prevData = lastBlock
    const table = fileName.split('.')[0]
    decodeStream.on('data', (data) => {
      if (!verifyData(table, data, prevData, skipVerifySignature)) {
        logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
        process.exit(1)
      }
      prevData = data
    })

    rs.on('finish', () => {
      logger.info(`Finished verifying snapshot file ${fileName}`)
    })
  }
}
