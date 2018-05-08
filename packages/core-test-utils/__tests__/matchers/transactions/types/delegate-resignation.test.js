const { DELEGATE_RESIGNATION } = require('@arkecosystem/client').constants

expect.extend({
  toBeDelegateResignationType: require('../../../../lib/matchers/transactions/types/delegate-resignation')
})

describe('.toBeDelegateResignationType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: DELEGATE_RESIGNATION }).toBeDelegateResignationType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeDelegateResignationType()
  })
})
