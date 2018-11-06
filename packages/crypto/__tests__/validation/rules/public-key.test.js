'use strict'

const rule = require('../../../lib/validation/rules/public-key')

describe('Public Key Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be true', () => {
    expect(rule('022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d').passes).toBeTrue()
  })

  it('should be false', () => {
    expect(rule('_022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d_').passes).toBeFalse()
  })
})
