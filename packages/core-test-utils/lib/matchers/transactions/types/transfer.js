const { TRANSFER } = require('@arkecosystem/crypto').constants

const toBeTransferType = received => ({
  message: () => 'Expected value to be a valid TRANSFER transaction.',
  pass: received.type === TRANSFER,
})

expect.extend({
  toBeTransferType,
})
