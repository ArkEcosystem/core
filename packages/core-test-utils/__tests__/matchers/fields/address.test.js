require('../../../lib/matchers/fields/address')

describe('.toBePhantomAddress', () => {
  test('passes when given a valid address', () => {
    expect('PL2dXvNtTg2bHY88e4ihnNxjNoJiu3xbK4').toBePhantomAddress()
  })

  test('fails when not given a valid address', () => {
    expect('invalid-address').not.toBePhantomAddress()
  })
})
