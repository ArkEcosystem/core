'use strict'

const rule = require('../../../lib/validation/rules/address')

describe('Address Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be true', () => {
    expect(rule('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN').passes).toBeTrue()
  })

  it('should be false', () => {
    expect(rule('_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_').passes).toBeFalse()
  })
})
