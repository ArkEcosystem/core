'use strict'

const { TIMELOCK_TRANSFER } = require('@arkecosystem/crypto').constants

const toBeTimelockTransferType = (received) => {
  return {
    message: () => 'Expected value to be a valid TIMELOCK_TRANSFER transaction.',
    pass: received.type === TIMELOCK_TRANSFER
  }
}

expect.extend({
  toBeTimelockTransferType
})
