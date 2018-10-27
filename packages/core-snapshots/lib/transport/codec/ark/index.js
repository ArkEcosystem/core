'use strict'

const { camelizeKeys, decamelizeKeys } = require('xcase')
const { Block } = require('@arkecosystem/crypto').models

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
  }
}
