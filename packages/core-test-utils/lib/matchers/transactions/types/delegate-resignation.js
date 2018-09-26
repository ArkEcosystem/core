'use strict'

const { DELEGATE_RESIGNATION } = require('@arkecosystem/crypto').constants

const toBeDelegateResignationType = (received) => {
  return {
    message: () => 'Expected value to be a valid DELEGATE_RESIGNATION transaction.',
    pass: received.type === DELEGATE_RESIGNATION
  }
}

expect.extend({
  toBeDelegateResignationType
})
