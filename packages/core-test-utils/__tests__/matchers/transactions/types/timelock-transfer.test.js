const { TIMELOCK_TRANSFER } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/timelock-transfer')

describe('.toBeTimelockTransferType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: TIMELOCK_TRANSFER }).toBeTimelockTransferType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeTimelockTransferType()
  })
})
