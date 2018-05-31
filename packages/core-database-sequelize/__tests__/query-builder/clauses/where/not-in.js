'use strict'

const clause = require('../../../lib/query-builder/clauses/where/not-in')

describe('Clauses - Where - NOT IN', () => {
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
