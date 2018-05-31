'use strict'

const clause = require('../../../lib/query-builder/clauses/abstracts/where')

describe('Clauses - Abstracts - WHERE', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
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
