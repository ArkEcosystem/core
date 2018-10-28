'use strict'

const { camelizeKeys, decamelizeKeys } = require('xcase')
const msgpack = require('msgpack-lite')
const pick = require('lodash/pick')

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
    const values = pick(transactionRecord, ['id', 'block_id', 'sequence', 'serialized'])
    return msgpack.encode(values)
  },

  transactionDecode: (bufferData) => {
    const values = msgpack.decode(bufferData)
    let transaction = {}
    transaction = Transaction.deserialize(Buffer.from(values.serialized).toString('hex'))

    transaction = Object.assign(values, transaction)
    transaction.amount = transaction.amount.toFixed()
    transaction.fee = transaction.fee.toFixed()
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : null

    return new TableRecord(decamelizeKeys(transaction))
  }
}
