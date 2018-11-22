const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

const toBeWallet = actual => ({
  message: () => 'Expected value to be a valid wallet',
  pass: isEqual(sortBy(Object.keys(actual)), ['address', 'publicKey']),
})

expect.extend({
  toBeWallet,
})
