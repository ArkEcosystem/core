const { vote } = require('@arkecosystem/client').constants

expect.extend({
  toBeVoteType: require('../../../../lib/matchers/transactions/types/vote')
})

describe('.toBeVoteType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: vote }).toBeVoteType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeVoteType()
  })
})
