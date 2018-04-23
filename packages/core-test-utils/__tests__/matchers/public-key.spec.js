expect.extend(require('../../lib/matchers/public-key'))

describe('.toBeArkPublicKey', () => {
  test('passes when given a public key', () => {
    expect('022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d').toBeArkPublicKey()
  })

  test('fails when not given a public key', () => {
    expect('invalid-public-key').toBeArkPublicKey()
  })
})
