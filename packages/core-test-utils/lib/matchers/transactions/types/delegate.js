'use strict'

const { DELEGATE } = require('@arkecosystem/crypto').constants

const toBeDelegateType = (received) => {
  return {
    message: () => 'Expected value to be a valid DELEGATE transaction.',
    pass: received.type === DELEGATE
  }
}

expect.extend({
  toBeDelegateType
})
