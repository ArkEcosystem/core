const { DELEGATE_RESIGNATION } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/delegate-resignation')

describe('.toBeDelegateResignationType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: DELEGATE_RESIGNATION }).toBeDelegateResignationType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeDelegateResignationType()
  })
})
