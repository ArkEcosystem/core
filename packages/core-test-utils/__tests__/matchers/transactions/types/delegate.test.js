const { DELEGATE } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/delegate')

describe('.toBeDelegateType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: DELEGATE }).toBeDelegateType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeDelegateType()
  })
})
