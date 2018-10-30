'use strict'

const { camelizeKeys, decamelizeKeys } = require('xcase')
const msgpack = require('msgpack-lite')
const { Block, Transaction } = require('@arkecosystem/crypto').models

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

    return decamelizeKeys(blockData)
  },

  transactionEncode: (transaction) => {
    return msgpack.encode([transaction.id, transaction.block_id, transaction.sequence, transaction.serialized])
  },

  transactionDecode: (bufferData) => {
    const values = msgpack.decode(bufferData)
    let transaction = {}
    transaction = Transaction.deserialize(values[3].toString('hex'))

    transaction.id = values[0]
    transaction.block_id = values[1]
    transaction.sequence = values[2]
    transaction.amount = transaction.amount.toFixed()
    transaction.fee = transaction.fee.toFixed()
    transaction.vendorFieldHex = transaction.vendorFieldHex ? transaction.vendorFieldHex : null
    transaction.recipientId = transaction.recipientId ? transaction.recipientId : null
    transaction = decamelizeKeys(transaction)

    transaction.serialized = values[3]
    return transaction
  }
}
