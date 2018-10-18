'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
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

  importTableStream: async (fileName, database, lastBlock, skipVerifySignature = false, chunkSize = 50000) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(utils.getPath(fileName)).pipe(decodeStream)
    const streamRead = database.pgp.spex.stream.read

    function receiver (_, data) {
      function source (index) {
          if (index < data.length) {
            // console.log('data', data)
            return data[index];
          }
      }
      function dest (index, data) {
          console.log('Iiiiiii', data.length)
          console.log(data)
          const insert = database.pgp.helpers.insert(data, database.getColumnSet(fileName.split('.')[0]))
          return this.none(insert);
      }

      return this.sequence(source, { dest: dest, limit: 5000 })
    }

    database.db.tx(t => {
        return streamRead.call(t, rs, receiver)
    })
    .then(data => {
          console.log('DATA:', data);
    })
    .catch(error => {
        console.log('ERROR:', error);
    })
  },

  importTable: async (fileName, database, lastBlock, skipVerifySignature = false, chunkSize = 50000) => {
    return new Promise((resolve, reject) => {
      const decodeStream = msgpack.createDecodeStream()
      const rs = fs.createReadStream(utils.getPath(fileName)).pipe(decodeStream)

      const table = fileName.split('.')[0]
      let values = []
      let prevData = lastBlock
      decodeStream.on('data', (data) => {
        if (!verifyData(table, data, prevData, skipVerifySignature)) {
          logger.error(`Error verifying data. Payload ${JSON.stringify(data, null, 2)}`)
          process.exit(1)
        }

        if (canImportRecord(table, data, lastBlock)) {
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

      database.db.task('massive-insert', t => {
        return t.sequence(index => {
          rs.resume()
          return getNextData(t, index)
          .then(data => {
            if (data) {
              logger.info(`Importing ${data.length} records from ${fileName}`)
              const insert = database.pgp.helpers.insert(data, database.getColumnSet(fileName.split('.')[0]))
              return t.none(insert)
            }
          })
        })
      })
      .then(data => {
          // COMMIT has been executed
          logger.info('Total batches:', data)
          resolve(data)
      })
      .catch(error => {
          // ROLLBACK has been executed
          logger.error(error)
          reject(error)
      })
    })
  },

  importTableOld: async (fileName, database, lastBlock, skipVerifySignature = false, chunkSize = 50000) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(utils.getPath(fileName)).pipe(decodeStream)

    let values = []
    const saveChunk = async (end = false) => {
      rs.pause()

      logger.info(`Importing ${values.length} records from ${fileName}`)
      const insert = database.pgp.helpers.insert(values.slice(), database.getColumnSet(fileName.split('.')[0]))
      values = []

      return database.db.tx(t => t.batch([insert]))
    }

    let prevData = lastBlock
    const table = fileName.split('.')[0]
    decodeStream.on('data', async (data) => {
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
        await saveChunk()
      }
    })

    // saving last batch
    rs.on('finish', async () => {
      if (values.length > 0) {
        const data = await saveChunk(true)
        console.log(data)
      }
    })
  },

  verifyTable: async (fileName, database, skipVerifySignature = false) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(utils.getPath(fileName)).pipe(decodeStream)
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
