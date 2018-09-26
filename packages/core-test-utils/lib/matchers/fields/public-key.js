'use strict'

const { crypto } = require('@arkecosystem/crypto')

const toBeArkPublicKey = (received) => {
  return {
    message: () => 'Expected value to be a valid public key',
    pass: crypto.validatePublicKey(received)
  }
}

expect.extend({
  toBeArkPublicKey
})
