const { TRANSFER } = require('@arkecosystem/crypto').constants

expect.extend({
  toBeTransferType: require('../../../../lib/matchers/transactions/types/transfer')
})

describe('.toBeTransferType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: TRANSFER }).toBeTransferType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeTransferType()
  })
})
