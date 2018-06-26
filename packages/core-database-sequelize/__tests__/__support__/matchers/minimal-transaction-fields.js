'use strict'

const { isEqual, sortBy } = require('lodash')

module.exports = (actual, expected) => {
  // TODO deserialize transaction and compare with expected
  const allowedKeys = sortBy(['block_id', 'serialized'])
  const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key))

  return {
    message: () => `Expected ${actual} to be a valid object with the minimal transaction fields (block_id and serialized)`,
    pass: isEqual(sortBy(actualKeys), allowedKeys)
  }
}
