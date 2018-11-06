require('../../../lib/matchers/models/delegate')

const delegate = {
  username: 'arkxdev',
  address: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
  publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
}

describe('.toBeDelegate', () => {
  test('passes when given a valid delegate', () => {
    expect(delegate).toBeDelegate()
  })

  test('fails when given an invalid delegate', () => {
    expect({ fake: 'news' }).not.toBeDelegate()
  })
})
