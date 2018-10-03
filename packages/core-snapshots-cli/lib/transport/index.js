'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')
const msgpack = require('msgpack-lite')
const stream = require('stream')
const util = require('util')
const finished = util.promisify(stream.finished)

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const env = require('../env')

module.exports = {
  exportTable: async (snapFileName, query, database, append = false) => {
    logger.info(`Starting to export table to ${snapFileName}, append:${append}`)

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

  importTable: async (fileName, database, chunkSize = 50000) => {
    const decodeStream = msgpack.createDecodeStream()
    const rs = fs.createReadStream(env.getPath(fileName)).pipe(decodeStream)

    let values = []
    let promises = []
    const saveChunk = (resume = true) => {
      rs.pause()
      logger.info(`Importing ${values.length} records from ${fileName}`)
      const insert = database.pgp.helpers.insert(values.slice(), database.getColumnSet(fileName.split('.')[0]))
      promises.push(database.db.none(insert))
      values = []
      if (resume) {
        rs.resume()
      }
    }

    decodeStream.on('data', (data) => {
      values.push(data)
      if (values.length % chunkSize === 0) {
        saveChunk()
      }
    })
    decodeStream.on('end', () => {
      if (values.length > 0) {
        saveChunk(false)
      }
    })

    await finished(rs)
    return Promise.all(promises)
  }
}
