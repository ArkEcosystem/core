const { MULTI_PAYMENT } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/multi-payment')

describe('.toBeMultiPaymentType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: MULTI_PAYMENT }).toBeMultiPaymentType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeMultiPaymentType()
  })
})
