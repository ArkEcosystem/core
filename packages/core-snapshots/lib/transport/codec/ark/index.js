'use strict'

const { camelizeKeys, decamelizeKeys } = require('xcase')
const msgpack = require('msgpack-lite')
const pick = require('lodash/pick');

const { Block, Transaction } = require('@arkecosystem/crypto').models
const TableRecord = require('../record')

module.exports = {
  blockEncode: (blockRecord) => {
    const data = camelizeKeys(blockRecord)
    return Block.serialize(data, true)
  },

  blockDecode: (bufferData) => {
    const blockData = Block.deserialize(bufferData.toString('hex'), true)
    blockData.id = Block.getIdFromSerialized(bufferData)

    blockData.totalAmount = blockData.totalAmount.toFixed()
    blockData.totalFee = blockData.totalFee.toFixed()
    blockData.reward = blockData.reward.toFixed()

    return new TableRecord(decamelizeKeys(blockData))
  },

  transactionEncode: (transactionRecord) => {
    const values = pick(transactionRecord, ['block_id', 'sequence', 'serialized'])
    return msgpack.encode(values)
  },

  transactionDecode: (bufferData) => {
    console.time('bufferDecode')
    const values = msgpack.decode(bufferData)
    console.timeEnd('bufferDecode')
    console.time('fromBytes')
    let transaction = Transaction.fromBytes(Buffer.from(values.serialized).toString('hex'))
    console.timeEnd('fromBytes')
    transaction.blockId = values.block_id
    transaction.sequence = values.sequence
    transaction.amount = transaction.amount.toFixed()
    transaction.fee = transaction.fee.toFixed()

    return new TableRecord(decamelizeKeys(transaction))
  }
}
