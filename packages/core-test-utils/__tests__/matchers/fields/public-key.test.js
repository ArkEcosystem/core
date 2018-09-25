require('../../../lib/matchers/fields/public-key')

describe('.toBeArkPublicKey', () => {
  test('passes when given a valid public key', () => {
    expect('022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d').toBeArkPublicKey()
  })
})
