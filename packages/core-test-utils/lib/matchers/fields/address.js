'use strict'

const { crypto } = require('@arkecosystem/crypto')

/**
 * Verify if the given value is an ark address.
 * @param  {String} received
 * @param  {String} argument
 * @return {Boolean}
 */
const toBeArkAddress = (received, argument) => {
  return {
    message: () => 'Expected value to be a valid address',
    pass: crypto.validateAddress(received, argument)
  }
}

expect.extend({
  toBeArkAddress
})
