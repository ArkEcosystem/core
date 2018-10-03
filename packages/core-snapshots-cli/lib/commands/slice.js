'use strict'
const fs = require('fs-extra')
const QueryStream = require('pg-query-stream')

const Transform = require('stream').Transform
const Database = require('../db/postgres')
const JSONStream = require('JSONStream');

module.exports = async (options) => {
  const database = new Database()
  fs.ensureFileSync('test.out')

  const myTransform = new Transform({
    transform (chunk, encoding, callback) {
      console.log(chunk)
      callback(null, chunk)
    }
  })

  const snapshotWriteStream = fs.createWriteStream('test.out')
  const qs = new QueryStream('SELECT serialized FROM TRANSACTIONS ORDER BY TIMESTAMP LIMIT 10')
  await database.db.stream(qs, s => s.pipe(JSONStream.stringifyObject()).pipe(myTransform).pipe(snapshotWriteStream))
}
