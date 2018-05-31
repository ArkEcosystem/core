'use strict'

const clause = require('../../../lib/query-builder/clauses/aggregates/min')

describe('Clauses - Aggregates - MIN', () => {
  it('should be an object', () => {
    expect(clause).toBeObject()
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(clause.apply).toBeFunction()
    })

    it('should be ok', () => {
      expect(true).toBeTruthy()
    })

    it('should not be ok', () => {
      expect(false).toBeFalsy()
    })
  })
})
