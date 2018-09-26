'use strict'

const { isEqual, sortBy } = require('lodash')

const toBeWallet = (actual) => {
  return {
    message: () => 'Expected value to be a valid wallet',
    pass: isEqual(sortBy(Object.keys(actual)), ['address', 'publicKey'])
  }
}

expect.extend({
  toBeWallet
})
