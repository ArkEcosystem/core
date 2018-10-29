'use strict'
const msgpack = require('msgpack-lite')
const columns = require('../../../db/utils/column-set')

module.exports = {
  blockEncode: (block) => {
    const values = Object.values(block)
    return msgpack.encode(values)
  },

  blockDecode: (bufferData) => {
    const values = msgpack.decode(bufferData)
    let block = {}
    columns.blocks.forEach((column, i) => {
      block[column] = values[i]
    })
    return block
  },

  transactionEncode: (transactionRecord) => {
    const values = Object.values(transactionRecord)
    return msgpack.encode(values)
  },

  transactionDecode: (bufferData) => {
    const values = msgpack.decode(bufferData)
    let transaction = {}
    columns.transactions.forEach((column, i) => {
      transaction[column] = values[i]
    })
    return transaction
  }
}
