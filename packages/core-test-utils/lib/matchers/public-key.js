'use strict';

const { crypto } = require('@arkecosystem/client')

/**
 * Verify if the given value is an ark public key.
 * @param  {String} received
 * @return {Boolean}
 */
module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid public key',
    pass: crypto.validatePublicKey(received)
  }
}
