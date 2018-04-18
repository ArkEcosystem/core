'use strict';

const { crypto } = require('@arkecosystem/client')

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid public key',
    pass: crypto.getAddress(received).length === 34
  }
}
