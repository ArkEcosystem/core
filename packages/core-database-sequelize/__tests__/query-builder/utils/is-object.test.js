'use strict'

const isObject = require('../../../lib/query-builder/utils/is-object')

describe('Utils - isObject', () => {
  it('should be an object', () => {
    expect(isObject).toBeFunction()
  })

  it('should be truthy', () => {
    expect(isObject({})).toBeTruthy()
  })

  it('should be falsy', () => {
    expect(isObject('string')).toBeFalsy()
  })
})
