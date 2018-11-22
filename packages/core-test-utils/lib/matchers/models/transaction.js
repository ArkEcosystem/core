const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

const toBeTransaction = actual => {
  // TODO based on type
  const allowedKeys = sortBy([
    'id',
    'type',
    'amount',
    'fee',
    'timestamp',
    'signature',
  ])
  const actualKeys = Object.keys(actual).filter(key =>
    allowedKeys.includes(key),
  )

  return {
    message: () => 'Expected value to be a valid transaction',
    pass: isEqual(sortBy(actualKeys), allowedKeys),
  }
}

expect.extend({
  toBeTransaction,
})
