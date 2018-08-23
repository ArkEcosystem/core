const { MULTI_PAYMENT } = require('@phantomchain/crypto').constants

const toBeMultiPaymentType = received => ({
  message: () => 'Expected value to be a valid MULTI_PAYMENT transaction.',
  pass: received.type === MULTI_PAYMENT,
})

expect.extend({
  toBeMultiPaymentType,
})
