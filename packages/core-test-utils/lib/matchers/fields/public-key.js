'use strict'

const { crypto } = require('@arkecosystem/crypto')

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid public key',
    pass: crypto.validatePublicKey(received)
  }
}
