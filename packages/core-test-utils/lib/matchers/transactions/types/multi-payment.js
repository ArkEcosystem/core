'use strict'

const { MULTI_PAYMENT } = require('@arkecosystem/crypto').constants

const toBeMultiPaymentType = (received) => {
  return {
    message: () => 'Expected value to be a valid MULTI_PAYMENT transaction.',
    pass: received.type === MULTI_PAYMENT
  }
}

expect.extend({
  toBeMultiPaymentType
})
