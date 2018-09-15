'use strict'

const rule = require('../../../lib/validation/rules/username')

describe('Username Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be truthy', () => {
    expect(rule('boldninja').passes).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(rule('bold ninja').passes).toBeFalsy()
  })
})
