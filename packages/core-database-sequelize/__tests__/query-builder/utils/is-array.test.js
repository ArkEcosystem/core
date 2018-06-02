'use strict'

const isArray = require('../../../lib/query-builder/utils/is-array')

describe('Utils - isArray', () => {
  it('should be an array', () => {
    expect(isArray).toBeFunction()
  })

  it('should be truthy', () => {
    expect(isArray([])).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(isArray('string')).toBeFalsy()
  })
})
