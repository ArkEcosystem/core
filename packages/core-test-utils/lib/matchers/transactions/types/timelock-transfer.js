'use strict'

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

const toBeTimelockTransferType = (received) => {
  return {
    message: () => 'Expected value to be a valid TIMELOCK_TRANSFER transaction.',
    pass: received.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER
  }
}

expect.extend({
  toBeTimelockTransferType
})
