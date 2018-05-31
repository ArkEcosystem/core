'use strict'

const sqlBuilder = require('../../lib/sql-builder')

describe('Utils - SQL Builder', () => {
  it('should be an object', () => {
    expect(sqlBuilder).toBeObject()
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
