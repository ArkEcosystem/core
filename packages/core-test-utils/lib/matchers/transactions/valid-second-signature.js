const { crypto } = require('@arkecosystem/crypto')

const toHaveValidSecondSignature = (actual, expected) => ({
  message: () => 'Expected value to have a valid second signature',
  pass: crypto.verifySecondSignature(
    actual,
    expected.publicKey,
    expected.network,
  ),
})

expect.extend({
  toHaveValidSecondSignature,
})
