'use strict'

const { crypto } = require('@arkecosystem/client')

module.exports = (actual, expected) => {
  console.log(crypto.verifySecondSignature(actual, expected.publicKey, expected.network))
  return {
    message: () => 'Expected value to have a valid second signature',
    pass: crypto.verifySecondSignature(actual, expected.publicKey, expected.network)
  }
}
