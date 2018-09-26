require('../../../lib/matchers/models/wallet')

const wallet = {
  address: 'DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh',
  publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
}

describe('.toBeWallet', () => {
  test('passes when given a valid wallet', () => {
    expect(wallet).toBeWallet()
  })

  test('fails when given an invalid wallet', () => {
    expect({ fake: 'news' }).not.toBeWallet()
  })
})
