'use strict'

const rule = require('../../../lib/validation/rules/public-key')

describe('Public Key Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be truthy', () => {
    expect(rule('022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d').passes).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(rule('_022cca9529ec97a772156c152a00aad155ee6708243e65c9d211a589cb5d43234d_').passes).toBeFalsy()
  })
})
