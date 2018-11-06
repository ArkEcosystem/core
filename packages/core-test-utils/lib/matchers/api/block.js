'use strict'

const { isEqual, sortBy } = require('lodash')

const toBeValidBlock = (actual, expected) => ({
  message: () => `Expected ${JSON.stringify(actual)} to be a valid block`,
  pass: isValidBlock(actual)
})

const toBeValidArrayOfBlocks = (actual, expected) => {
  const message = () => `Expected ${JSON.stringify(actual)} to be a valid array of blocks`

  if (!Array.isArray(actual)) {
    return { message, pass: false }
  }

  actual.forEach(peer => {
    if (!isValidBlock(peer)) {
      return { message, pass: false }
    }
  })

  return { message, pass: true }
}

function isValidBlock (block) {
  const allowedKeys = sortBy(['blockSignature', 'createdAt', 'generatorPublicKey', 'height', 'id', 'numberOfTransactions', 'payloadHash',
    'payloadLength', 'previousBlock', 'reward', 'timestamp', 'totalAmount', 'totalFee', 'transactions', 'updatedAt', 'version'])
  const actualKeys = Object.keys(block).filter(key => allowedKeys.includes(key))

  return isEqual(sortBy(actualKeys), allowedKeys)
}

expect.extend({
  toBeValidBlock,
  toBeValidArrayOfBlocks
})
