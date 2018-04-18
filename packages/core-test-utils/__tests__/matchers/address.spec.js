expect.extend(require('../../src/matchers/address'))

describe('.toBeArkAddress', () => {
  test('passes when given an address', () => {
    expect('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN').toBeArkAddress()
  })

  test('fails when not given an address', () => {
    expect('invalid-address').toBeArkAddress()
  })
})
