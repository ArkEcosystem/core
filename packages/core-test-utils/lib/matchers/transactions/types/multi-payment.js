'use strict'

const { MULTI_PAYMENT } = require('@arkecosystem/client').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid MULTI_PAYMENT transaction.',
    pass: received.type === MULTI_PAYMENT
  }
}
