'use strict'

const { crypto } = require('@arkecosystem/client')

module.exports = (transaction, network) => {
  return {
    message: () => 'Expected value to be a valid transaction',
    pass: crypto.verify(transaction, network)
  }
}
