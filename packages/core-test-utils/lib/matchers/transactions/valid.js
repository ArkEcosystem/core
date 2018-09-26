'use strict'

const { crypto } = require('@arkecosystem/crypto')

const toBeValidTransaction = (transaction, network) => {
  return {
    message: () => 'Expected value to be a valid transaction',
    pass: crypto.verify(transaction, network)
  }
}

expect.extend({
  toBeValidTransaction
})
