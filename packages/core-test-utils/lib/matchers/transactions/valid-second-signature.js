const { crypto } = require('@arkecosystem/crypto')

const toHaveValidSecondSignature = (actual, expected) => {
  let verified
  try {
    verified = crypto.verifySecondSignature(actual, expected.publicKey)
  } catch (e) {} // eslint-disable-line no-empty
  return {
    message: () => 'Expected value to have a valid second signature',
    pass: !!verified,
  }
}

expect.extend({
  toHaveValidSecondSignature,
})
