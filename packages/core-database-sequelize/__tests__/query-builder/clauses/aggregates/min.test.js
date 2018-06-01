'use strict'

const clause = require('../../../../lib/query-builder/clauses/aggregates/min')

describe('Clauses - Aggregates - MIN', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('using values', () => {
    it('should be ok without an alias', () => {
      expect(clause('balance')).toEqual(['MIN ("balance") AS "balance"'])
    })

    it('should be ok with an alias', () => {
      expect(clause('balance', 'dummy-alias')).toEqual(['MIN ("balance") AS "dummy-alias"'])
    })
  })
})
