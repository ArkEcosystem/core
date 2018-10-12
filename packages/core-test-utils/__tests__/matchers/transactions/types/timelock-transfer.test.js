const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/timelock-transfer')

describe('.toBeTimelockTransferType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: TRANSACTION_TYPES.TIMELOCK_TRANSFER }).toBeTimelockTransferType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeTimelockTransferType()
  })
})
