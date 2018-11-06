'use strict'

const { SECOND_SIGNATURE } = require('@arkecosystem/crypto').constants

const toBeSecondSignatureType = (received) => {
  return {
    message: () => 'Expected value to be a valid SECOND_SIGNATURE transaction.',
    pass: received.type === SECOND_SIGNATURE
  }
}

expect.extend({
  toBeSecondSignatureType
})
