'use strict'

const { isEqual, sortBy } = require('lodash')

const toBeApiTransaction = (actual, expected) => {
  // TODO based on type
  const allowedKeys = sortBy(['id', 'blockid', 'type', 'timestamp', 'amount', 'fee', 'senderId', 'senderPublicKey', 'signature', 'asset', 'confirmations'])
  const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key))

  return {
    message: () => `Expected ${JSON.stringify(actual)} to be a valid transaction`,
    pass: isEqual(sortBy(actualKeys), allowedKeys)
  }
}

expect.extend({
  toBeApiTransaction
})
