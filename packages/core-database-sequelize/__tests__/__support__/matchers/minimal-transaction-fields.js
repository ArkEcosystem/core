'use strict'

const { isEqual, sortBy } = require('lodash')

module.exports = (actual, expected) => {
  // TODO deserialize transaction and compare with expected
  const allowedKeys = sortBy(['blockId', 'serialized'])
  const actualKeys = Object.keys(actual).filter(key => allowedKeys.includes(key))

  return {
    message: () => `Expected ${actual} to be a valid object with the minimal transaction fields (blockId and serialized)`,
    pass: isEqual(sortBy(actualKeys), allowedKeys)
  }
}
