const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

const toBeDelegate = actual => ({
  message: () => 'Expected value to be a valid delegate',
  pass: isEqual(sortBy(Object.keys(actual)), [
    'address',
    'publicKey',
    'username',
  ]),
})

expect.extend({
  toBeDelegate,
})
