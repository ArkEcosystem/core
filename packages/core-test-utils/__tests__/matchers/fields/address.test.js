require('../../../lib/matchers/fields/address')

describe('.toBePhantomAddress', () => {
  test('passes when given a valid address', () => {
    expect('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN').toBePhantomAddress()
  })

  test('fails when not given a valid address', () => {
    expect('invalid-address').not.toBePhantomAddress()
  })
})
