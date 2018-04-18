'use strict';

const { crypto } = require('@arkecosystem/client')

module.exports = (received, argument) => {
  return {
    message: () => 'Expected value to be a valid address',
    pass: crypto.validateAddress(received, argument)
  }
}
