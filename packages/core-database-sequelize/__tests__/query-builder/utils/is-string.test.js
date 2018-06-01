'use strict'

const isString = require('../../../lib/query-builder/utils/is-string')

describe('Utils - isString', () => {
  it('should be an string', () => {
    expect(isString).toBeFunction()
  })

  it('should be truthy', () => {
    expect(isString('string')).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(isString(123)).toBeFalsy()
  })
})
