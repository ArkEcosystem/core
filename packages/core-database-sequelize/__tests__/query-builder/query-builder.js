'use strict'

const queryBuilder = require('../../lib/query-builder')

describe('Utils - Query Builder', () => {
  it('should be an object', () => {
    expect(queryBuilder).toBeObject()
  })

  describe('should be truthy', () => {
    it('should be ok', () => {
      expect(true).toBeTruthy()
    })

    it('should not be ok', () => {
      expect(false).toBeFalsy()
    })
  })
})
