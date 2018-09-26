'use strict'

const { MULTI_SIGNATURE } = require('@arkecosystem/crypto').constants

const toBeMultiSignatureType = (received) => {
  return {
    message: () => 'Expected value to be a valid MULTI_SIGNATURE transaction.',
    pass: received.type === MULTI_SIGNATURE
  }
}

expect.extend({
  toBeMultiSignatureType
})
