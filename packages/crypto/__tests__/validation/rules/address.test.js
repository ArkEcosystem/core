'use strict'

const rule = require('../../../lib/validation/rules/address')

describe('Address Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be truthy', () => {
    expect(rule('DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN').passes).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(rule('_DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN_').passes).toBeFalsy()
  })
})
