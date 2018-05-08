'use strict'

const { isEqual, sortBy } = require('lodash')

module.exports = (actual) => {
  return {
    message: () => 'Expected value to be a valid delegate',
    pass: isEqual(sortBy(Object.keys(actual)), ['address', 'publicKey', 'username'])
  }
}
