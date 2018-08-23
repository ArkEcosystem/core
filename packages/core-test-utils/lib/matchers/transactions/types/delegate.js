const { DELEGATE } = require('@phantomchain/crypto').constants

const toBeDelegateType = received => ({
  message: () => 'Expected value to be a valid DELEGATE transaction.',
  pass: received.type === DELEGATE,
})

expect.extend({
  toBeDelegateType,
})
