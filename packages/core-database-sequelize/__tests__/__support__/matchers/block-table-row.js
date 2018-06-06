'use strict'

const { isEqual, sortBy } = require('lodash')

module.exports = (actual, expected) => {
  const allowedKeys = sortBy(['id', 'version', 'timestamp', 'previousBlock', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength', 'payloadHash', 'generatorPublicKey', 'blockSignature', 'createdAt', 'updatedAt'])
  const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key))

  return {
    message: () => `Expected ${actual} to be a block table row`,
    pass: isEqual(sortBy(actualKeys), allowedKeys)
  }
}
