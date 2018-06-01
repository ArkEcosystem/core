'use strict'

const clause = require('../../../../lib/query-builder/clauses/aggregates/avg')

describe('Clauses - Aggregates - AVG', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('using values', () => {
    it('should be ok without an alias', () => {
      expect(clause('balance')).toEqual(['AVG ("balance") AS "balance"'])
    })

    it('should be ok with an alias', () => {
      expect(clause('balance', 'dummy-alias')).toEqual(['AVG ("balance") AS "dummy-alias"'])
    })
  })
})
