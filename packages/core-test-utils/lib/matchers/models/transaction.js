'use strict'

const { isEqual, sortBy } = require('lodash')

module.exports = (actual) => {
  // TODO based on type
  const allowedKeys = sortBy(['id', 'type', 'amount', 'fee', 'timestamp', 'signature'])
  const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key))

  return {
    message: () => 'Expected value to be a valid transaction',
    pass: isEqual(sortBy(actualKeys), allowedKeys)
  }
}
